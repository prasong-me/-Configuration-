const serializers = new Map();

export function registerSerializer(format, serialize){
  if(typeof format!=="string"||!format.trim()) throw new TypeError("Serializer format is required.");
  if(typeof serialize!=="function") throw new TypeError("Serializer must be a function.");
  if(serializers.has(format)) throw new TypeError(`Serializer already registered: ${format}`);
  serializers.set(format,{format,serialize});
}
export function getSerializer(format){return serializers.get(format)??null;}
export function listSerializers(){return [...serializers.keys()];}
export function serializeRepresentation(format,representation){
  const serializer=getSerializer(format);
  if(!serializer) throw new TypeError(`Serializer not registered: ${format}`);
  return serializer.serialize(representation);
}

registerSerializer("text",value=>String(value));
registerSerializer("ini",value=>String(value));
registerSerializer("yaml",value=>String(value));
registerSerializer("json",value=>typeof value==="string"?value:JSON.stringify(value,null,2));
registerSerializer("plist",value=>String(value));
