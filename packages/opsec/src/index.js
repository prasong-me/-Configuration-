const SECRET_KEY=/(?:^|_|-)(password|passphrase|token|secret|private[ _-]?key|credential)(?:$|_|-)/i;
export function redact(value){if(Array.isArray(value))return value.map(redact);if(!value||typeof value!=="object")return value;return Object.fromEntries(Object.entries(value).map(([key,val])=>[key,SECRET_KEY.test(key)?"[REDACTED]":redact(val)]));}
export function classifyKey(key){if(typeof key!=="string")return "PUBLIC";return SECRET_KEY.test(key)?"SECRET":"SENSITIVE";}
export function classify(value){return value==null?"PUBLIC":"SENSITIVE";}
