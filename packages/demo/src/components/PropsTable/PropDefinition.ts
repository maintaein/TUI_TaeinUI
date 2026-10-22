/** Props 항목 하나. `PropsList`가 그린다 */
export interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}
