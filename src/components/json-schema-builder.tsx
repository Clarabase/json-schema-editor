import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { PlusCircle, X } from "lucide-react";
import { exportSchema, ExportFormat } from "../lib/exporters/export";
import { seedSchema } from "../lib/seeder";

type FieldType = "string" | "number" | "boolean" | "array" | "object" | "enum";

type StringFormat =
  | "date-time"
  | "time"
  | "date"
  | "duration"
  | "email"
  | "idn-email"
  | "hostname"
  | "idn-hostname"
  | "ipv4"
  | "ipv6"
  | "uri"
  | "uri-reference"
  | "iri"
  | "iri-reference"
  | "uuid"
  | "json-pointer"
  | "relative-json-pointer"
  | "regex";

interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
  options: Record<string, any>;
  format?: StringFormat;
  items?: {
    type: Exclude<FieldType, "array">;
    format?: StringFormat;
  };
  enumValues?: string[];
}

const stringFormats: StringFormat[] = [
  "date-time",
  "time",
  "date",
  "duration",
  "email",
  "idn-email",
  "hostname",
  "idn-hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "iri",
  "iri-reference",
  "uuid",
  "json-pointer",
  "relative-json-pointer",
  "regex",
];

export function JsonSchemaBuilder() {
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [currentField, setCurrentField] = useState<SchemaField>({
    name: "",
    type: "string",
    required: true,
    options: {},
    format: undefined,
    items: undefined,
    enumValues: [],
  });
  const [schema, setSchema] = useState<string>("");
  const [newEnumValue, setNewEnumValue] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"json" | "remove" | "generate">(
    "json"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [schemaName, setSchemaName] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<string>("");
  const [sampleDataCount, setSampleDataCount] = useState<number>(1);

  const resetCurrentField = () => ({
    name: "",
    type: "string",
    required: true,
    options: {},
    format: undefined,
    items: undefined,
    enumValues: [],
  });

  const addField = () => {
    const isDuplicate = fields.some(
      (field) =>
        field.name === currentField.name && field.type === currentField.type
    );

    if (isDuplicate) {
      setErrorMessage("A field with the same name and type already exists.");
      return;
    }

    if (currentField.name) {
      setFields([...fields, currentField]);
      setCurrentField(resetCurrentField() as SchemaField);
      updateSchema([...fields, currentField]);
      setErrorMessage("");
    }
  };

  const updateSchema = (updatedFields: SchemaField[]) => {
    const schemaObj = {
      $id: `https://example.com/${(schemaName || "example")
        .toLowerCase()
        .replace(/\s+/g, "-")}.json`,
      $schema: "http://json-schema.org/draft/2020-12/schema",
      title: schemaName || "Example Schema",
      type: "object",
      properties: updatedFields.reduce((acc, field) => {
        if (field.type === "enum") {
          acc[field.name] = {
            type: "string",
            enum: field.enumValues,
          };
        } else {
          acc[field.name] = {
            type: field.type,
            ...field.options,
            ...(field.type === "string" &&
              field.format && { format: field.format }),
            ...(field.type === "array" &&
              field.items && {
                items: {
                  type: field.items.type,
                  ...(field.items.format && { format: field.items.format }),
                },
              }),
          };
        }
        return acc;
      }, {} as Record<string, any>),
      required:
        updatedFields.length > 0
          ? updatedFields
              .filter((field) => field.required)
              .map((field) => field.name)
          : ["id", "schema", "required"],
    };
    setSchema(JSON.stringify(schemaObj, null, 2));
  };

  const downloadSchema = () => {
    const blob = new Blob([schema], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(schemaName || "example").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addOption = (option: string, value: any) => {
    setCurrentField({
      ...currentField,
      options: { ...currentField.options, [option]: value },
    });
  };

  const addEnumValue = () => {
    if (newEnumValue && !currentField.enumValues?.includes(newEnumValue)) {
      setCurrentField({
        ...currentField,
        enumValues: [...(currentField.enumValues || []), newEnumValue],
      });
      setNewEnumValue("");
    }
  };

  const removeEnumValue = (value: string) => {
    setCurrentField({
      ...currentField,
      enumValues: currentField.enumValues?.filter((v) => v !== value),
    });
  };

  const removeField = (fieldName: string) => {
    const updatedFields = fields.filter((field) => field.name !== fieldName);
    setFields(updatedFields);
    updateSchema(updatedFields);
  };

  const renderOptions = () => {
    switch (currentField.type) {
      case "string":
        return (
          <>
            <div className="col-span-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={currentField.format}
                onValueChange={(value: StringFormat) =>
                  setCurrentField({ ...currentField, format: value })
                }
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  {stringFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="minLength">Min Length</Label>
              <Input
                id="minLength"
                type="number"
                value={currentField.options.minLength || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  addOption("minLength", parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                value={currentField.options.maxLength || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  addOption("maxLength", parseInt(e.target.value))
                }
              />
            </div>
          </>
        );
      case "number":
        return (
          <>
            <div>
              <Label htmlFor="minimum">Minimum</Label>
              <Input
                id="minimum"
                type="number"
                value={currentField.options.minimum || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  addOption("minimum", parseFloat(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="maximum">Maximum</Label>
              <Input
                id="maximum"
                type="number"
                value={currentField.options.maximum || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  addOption("maximum", parseFloat(e.target.value))
                }
              />
            </div>
          </>
        );
      case "array":
        return (
          <>
            <div className="col-span-2">
              <Label htmlFor="arrayType">Array Item Type</Label>
              <Select
                value={currentField.items?.type || ""}
                onValueChange={(value: Exclude<FieldType, "array">) =>
                  setCurrentField({
                    ...currentField,
                    items: { type: value, format: undefined },
                  })
                }
              >
                <SelectTrigger id="arrayType">
                  <SelectValue placeholder="Select array item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentField.items?.type === "string" && (
              <div className="col-span-2">
                <Label htmlFor="arrayItemFormat">Array Item Format</Label>
                <Select
                  value={currentField.items.format}
                  onValueChange={(value: StringFormat) =>
                    setCurrentField({
                      ...currentField,
                      items: { ...currentField.items, format: value },
                    } as SchemaField)
                  }
                >
                  <SelectTrigger id="arrayItemFormat">
                    <SelectValue placeholder="Select format (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    {stringFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="minItems">Min Items</Label>
              <Input
                id="minItems"
                type="number"
                onChange={(e) =>
                  addOption("minItems", parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="maxItems">Max Items</Label>
              <Input
                id="maxItems"
                type="number"
                onChange={(e) =>
                  addOption("maxItems", parseInt(e.target.value))
                }
              />
            </div>
          </>
        );
      case "enum":
        return (
          <div className="col-span-2 space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newEnumValue}
                onChange={(e) => setNewEnumValue(e.target.value)}
                placeholder="Enter enum value"
              />
              <Button onClick={addEnumValue} type="button">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {currentField.enumValues?.map((value) => (
                <div
                  key={value}
                  className="flex items-center justify-between bg-secondary p-2 rounded"
                >
                  <span>{value}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEnumValue(value)}
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const resetSchema = () => {
    setFields([]);
    setSchema("");
    setCurrentField(resetCurrentField() as SchemaField);
    setSchemaName("");
  };

  const handleExport = (format: ExportFormat) => {
    const exportedData = exportSchema(schema, format as ExportFormat);
    const blob = new Blob([exportedData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(schemaName || "example").toLowerCase()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSampleData = () => {
    const sampleData = seedSchema(JSON.parse(schema), {
      count: sampleDataCount,
    });
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(schemaName || "example").toLowerCase()}-sample.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-black dark:text-white">
          JSON Schema Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="font-mono bg-gray-100 dark:bg-gray-900 p-4 rounded-md text-black dark:text-white">
            The JSON Schema Editor is a tool to help you create and edit JSON
            Schema. It is based on the{" "}
            <a
              className="text-blue-500 dark:text-blue-300 font-bold underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              href="https://json-schema.org/"
              target="_blank"
              rel="noreferrer"
            >
              JSON Schema Specification
            </a>
            . JSON schema can be validated with a schema{" "}
            <a
              className="text-blue-500 dark:text-blue-300 font-bold underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              href="https://json-schema.org/tools?query=&sortBy=name&sortOrder=ascending&groupBy=toolingTypes&licenses=&languages=&drafts=&toolingTypes=validator&environments="
              target="_blank"
              rel="noreferrer"
            >
              validator
            </a>
            . In addition, you can:
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-gray-700 dark:text-gray-300">
                Add and remove fields
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                Download the schema
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                Export the schema into one of the supported export formats such
                as SQL, GraphQL, or Protobuf
              </li>
              <li className="text-gray-700 dark:text-gray-300">
                Generate sample data from the schema
              </li>
            </ul>
          </div>
          <hr className="my-4 border-gray-300 dark:border-gray-700" />
          <div>
            <Label htmlFor="schemaName" className="text-black dark:text-white">
              Schema Name
            </Label>
            <Input
              id="schemaName"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="Enter schema name"
              className="bg-white dark:bg-gray-700 text-black dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                value={currentField.name}
                onChange={(e) =>
                  setCurrentField({ ...currentField, name: e.target.value })
                }
                placeholder="Enter field name"
              />
            </div>
            <div>
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={currentField.type}
                onValueChange={(value: FieldType) =>
                  setCurrentField({
                    ...currentField,
                    type: value,
                    options: {},
                    format: undefined,
                    items: value === "array" ? { type: "string" } : undefined,
                    enumValues: value === "enum" ? [] : undefined,
                  })
                }
              >
                <SelectTrigger id="fieldType">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent className="z-10">
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                  <SelectItem value="enum">Enum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Checkbox
              id="required"
              className="border"
              checked={currentField.required}
              onCheckedChange={(checked: boolean) =>
                setCurrentField({
                  ...currentField,
                  required: checked as boolean,
                })
              }
            />
            <Label htmlFor="required">Required</Label>
          </div>
          <div className="space-y-2 py-2">
            <Label className="text-md">Options</Label>
            <div className="grid grid-cols-2 gap-4">{renderOptions()}</div>
          </div>
          {errorMessage && <div className="text-red-500">{errorMessage}</div>}
          <Button
            onClick={addField}
            variant="secondary"
            className="bg-slate-200 hover:bg-slate-300 w-full"
          >
            Add Field
          </Button>
          <div className="border p-4 rounded-md">
            <div className="flex space-x-4 border-b-2 mb-4">
              <div
                onMouseDown={() => setActiveTab("json")}
                className={`w-1/3 py-2 text-center ${
                  activeTab === "json"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
              >
                View Schema
              </div>
              <div
                onMouseDown={() => setActiveTab("remove")}
                className={`w-1/3 py-2 text-center ${
                  activeTab === "remove"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
              >
                Remove Fields
              </div>
              <div
                onMouseDown={() => setActiveTab("generate")}
                className={`w-1/3 py-2 text-center ${
                  activeTab === "generate"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
              >
                Generate Sample Data
              </div>
            </div>
            {activeTab === "json" ? (
              <div className="space-y-2">
                <Textarea
                  id="schemaOutput"
                  value={schema}
                  readOnly
                  className="h-40 font-mono"
                />
              </div>
            ) : activeTab === "remove" ? (
              <div className="space-y-2">
                <div className="h-40 overflow-y-auto border p-2">
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className="flex justify-between items-center"
                    >
                      <span>{field.name}</span>
                      <Button
                        onClick={() => removeField(field.name)}
                        variant="ghost"
                        size="icon"
                      >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sampleDataCount">Number of Samples</Label>
                  <Input
                    id="sampleDataCount"
                    type="number"
                    min={1}
                    max={25}
                    value={sampleDataCount}
                    onChange={(e) =>
                      setSampleDataCount(
                        Math.min(25, Math.max(1, parseInt(e.target.value)))
                      )
                    }
                  />
                </div>
                <Button
                  onClick={generateSampleData}
                  variant="secondary"
                  className="bg-blue-200 hover:bg-blue-300 w-full"
                  disabled={!schema}
                >
                  Generate
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button
              onClick={resetSchema}
              variant="secondary"
              className="bg-red-200 hover:bg-red-300 w-1/4"
              disabled={fields.length === 0}
            >
              Reset Schema
            </Button>
            <div className="flex space-x-2">
              <div className="relative">
                <Button
                  onClick={() =>
                    setExportFormat((prev) => (prev ? "" : "open"))
                  }
                  variant="secondary"
                  className="bg-blue-200 hover:bg-blue-300 w-full"
                  disabled={fields.length === 0}
                >
                  Export As
                </Button>
                {exportFormat && (
                  <div className="absolute bottom-full mb-2 w-48 bg-white border rounded shadow-lg">
                    <div
                      onClick={() => handleExport("sql")}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                    >
                      SQL
                    </div>
                    <div
                      onClick={() => handleExport("gql")}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                    >
                      GraphQL
                    </div>
                    <div
                      onClick={() => handleExport("proto")}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                    >
                      Protobuf
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={downloadSchema}
                variant="secondary"
                className="bg-green-200 hover:bg-green-300 w-full"
                disabled={fields.length === 0}
              >
                Download Schema
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
