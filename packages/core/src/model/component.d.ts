export type ComponentType =
  | 'dns'
  | 'source'
  | 'vpn'
  | 'proxy'
  | 'routing'
  | 'wifi'
  | 'webClip';

export interface ProfileComponent {
  type: ComponentType;
  data: Record<string, unknown>;
}
