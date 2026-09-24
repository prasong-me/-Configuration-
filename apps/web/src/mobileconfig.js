const xmlEscape=value=>String(value)
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&apos;");

function uuid(){
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
    const r=Math.random()*16|0;
    const v=c==="x"?r:(r&3|8);
    return v.toString(16);
  });
}

export function createIosWebClipMobileConfig({
  label="Network Configuration",
  url=window.location.href
}={}){
  const profileId=uuid();
  const webClipId=uuid();
  const safeLabel=xmlEscape(label);
  const safeUrl=xmlEscape(url);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>${safeLabel}</string>
      <key>PayloadDescription</key>
      <string>ติดตั้งทางลัดเว็บแอปบนหน้าจอโฮมของ iOS</string>
      <key>PayloadDisplayName</key>
      <string>${safeLabel}</string>
      <key>PayloadIdentifier</key>
      <string>configuration-platform.webclip.${webClipId}</string>
      <key>PayloadOrganization</key>
      <string>Configuration Platform</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>${webClipId}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>URL</key>
      <string>${safeUrl}</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Web App สำหรับ Configuration Platform</string>
  <key>PayloadDisplayName</key>
  <string>${safeLabel}</string>
  <key>PayloadIdentifier</key>
  <string>configuration-platform.profile.${profileId}</string>
  <key>PayloadOrganization</key>
  <string>Configuration Platform</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileId}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
}
