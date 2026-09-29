const ALLOWED_FORMATS=Object.freeze(["plist","json","yaml","ini","text"]);

function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==="object") return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
  return value;
}

function assertFormat(format){
  if(typeof format!=="string"||!ALLOWED_FORMATS.includes(format)) throw new TypeError("Unsupported output format: "+format);
  return format;
}

export function createSerializerRegistry(initial=[]){
  const local=new Map();
  const registry={
    register(format,serializer){
      assertFormat(format);
      if(typeof serializer!=="function") throw new TypeError("Serializer must be a function.");
      if(local.has(format)) throw new Error("Serializer already registered: "+format);
      local.set(format,serializer);
      return registry;
    },
    resolve(format){ assertFormat(format); return local.get(format)??null; },
    has(format){ assertFormat(format); return local.has(format); },
    formats(){ return [...local.keys()]; }
  };
  for(const entry of initial){
    if(!entry||typeof entry.format!=="string") throw new TypeError("Serializer registration requires format.");
    registry.register(entry.format,entry.serialize);
  }
  return registry;
}

export const SerializerFormat=Object.freeze({
  PLIST:"plist",JSON:"json",YAML:"yaml",INI:"ini",TEXT:"text"
});

export const defaultSerializerRegistry=createSerializerRegistry([
  {format:"json",serialize(value){ return typeof value==="string" ? value : JSON.stringify(stable(value),null,2); }},
  {format:"plist",serialize(value){ return typeof value==="string" ? value : String(value); }},
  {format:"yaml",serialize(value){ return typeof value==="string" ? value : String(value); }},
  {format:"ini",serialize(value){ return typeof value==="string" ? value : String(value); }},
  {format:"text",serialize(value){ return typeof value==="string" ? value : String(value); }}
]);

export function listSupportedSerializerFormats(){
  return [...ALLOWED_FORMATS];
}
