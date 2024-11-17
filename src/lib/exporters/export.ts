import { exportToProtobuf } from "./protobuf";
import { exportToSQL } from "./sql";
import { exportToGQL } from "./gql";

export type ExportFormat = "sql" | "gql" | "proto";

export function exportSchema(jsonSchema: any, format: ExportFormat): string {
  switch (format) {
    case "sql":
      return exportToSQL(jsonSchema);
    case "gql":
      return exportToGQL(jsonSchema);
    case "proto":
      return exportToProtobuf(jsonSchema);
  }
}
