#!/usr/bin/env python3
import argparse
import json
import math
import subprocess
import time

DEFAULT_SERVERS = ["1.1.1.1","1.0.0.1","9.9.9.9","149.112.112.112","8.8.8.8","8.8.4.4"]

def percentile(values, p):
    if not values:
        return None
    values = sorted(values)
    rank = (p / 100.0) * (len(values) - 1)
    lo, hi = int(math.floor(rank)), int(math.ceil(rank))
    return values[lo] if lo == hi else values[lo] + (values[hi] - values[lo]) * (rank - lo)

def summarize(values):
    values = [x for x in values if math.isfinite(x)]
    if not values:
        return {"samples":0,"median":None,"p95":None,"p99":None,"min":None,"max":None}
    return {"samples":len(values),"median":percentile(values,50),"p95":percentile(values,95),
            "p99":percentile(values,99),"min":min(values),"max":max(values)}

def run_one(server, query, timeout):
    started = time.perf_counter()
    try:
        result = subprocess.run(
            ["dig","@"+server,query,"A","+time="+str(max(1,int(timeout))),"+tries=1","+stats","+short"],
            capture_output=True, text=True, timeout=timeout + 1)
        elapsed = (time.perf_counter() - started) * 1000.0
        if result.returncode != 0 or not result.stdout.strip():
            raise RuntimeError((result.stderr or "empty DNS answer").strip())
        return elapsed, None
    except Exception as exc:
        return None, str(exc)

def run(query="example.com", iterations=10, timeout=5.0, servers=None):
    servers = servers or DEFAULT_SERVERS
    report = {"platform":"ios-pyto","query":query,"iterations":iterations,
              "timeoutMs":timeout*1000,"results":[]}
    for server in servers:
        samples, errors = [], []
        for _ in range(max(1,iterations)):
            ms, error = run_one(server, query, timeout)
            if ms is not None: samples.append(ms)
            else: errors.append(error)
        report["results"].append({"server":server,**summarize(samples),"errors":errors})
    return report

def main():
    parser = argparse.ArgumentParser(description="Pyto/iOS DNS resolver benchmark")
    parser.add_argument("--query",default="example.com")
    parser.add_argument("--iterations",type=int,default=10)
    parser.add_argument("--timeout",type=float,default=5)
    parser.add_argument("--servers",default=",".join(DEFAULT_SERVERS))
    parser.add_argument("--json",action="store_true")
    args = parser.parse_args()
    report = run(args.query,args.iterations,args.timeout,[x.strip() for x in args.servers.split(",") if x.strip()])
    if args.json:
        print(json.dumps(report,indent=2))
        return
    print("Pyto/iOS DNS benchmark: {} | iterations={} | timeout={}ms".format(report["query"],report["iterations"],int(report["timeoutMs"])))
    for item in report["results"]:
        def fmt(value): return "n/a" if value is None else "{:.2f} ms".format(value)
        print("{:<16} samples={:>3} median={:>10} p95={:>10} p99={:>10} errors={}".format(
            item["server"],item["samples"],fmt(item["median"]),fmt(item["p95"]),fmt(item["p99"]),len(item["errors"])))

if __name__ == "__main__":
    main()
