const ALLOWED_FORMATS=Object.freeze(["plist","json","yaml","ini","text"]);
const serializers=new Map();

function assertFormat(format){
  if(typeof format!=="string"||!ALLOWED_FORMATS.includes(format)) throw new TypeError("Unsupported output format: "+format);
  return format;
}

export function createSerializerRegistry(initial=[]){
  const registry={
    register(format,serializer){
      assertFormat(format);
      if(typeof serializer!=="function") throw new TypeError("Serializer must be a function.");
      if(serializers.has(format)||initial.some(x=>x?.format===format)) throw new Error("Serializer already registered: "+format);
      local.set(format,serializer);
      return registry;
    },
    resolve(format){ assertFormat(format); return local.get(format)??null; },
    has(format){ assertFormat(format); return local.has(format); },
    formats(){ return [...local.keys()]; }
  };
  const local=new Map();
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
  {format:"json",serialize(value){ return typeof value==="string" ? value : JSON.stringify(value,null,2); }},
  {format:"text",serialize(value){ return typeof value==="string" ? value : String(value); }}
]);

export function listSupportedSerializerFormats(){
  return [...ALLOWED_FORMATS];
}
