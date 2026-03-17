import { DefaultNamingStrategy } from "typeorm";

/**
 * No convierte nombres a snake_case: usa el nombre explícito del @Column o el nombre de la propiedad.
 * Útil cuando la DB tiene columnas en camelCase (p. ej. providerCategoryKey).
 */
export class CamelCaseNamingStrategy extends DefaultNamingStrategy {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    const name = customName || propertyName;
    if (embeddedPrefixes.length) {
      return embeddedPrefixes.join("_") + name;
    }
    return name;
  }
}
