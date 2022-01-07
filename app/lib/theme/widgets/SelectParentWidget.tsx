import Dropdown from "@button-inc/bcgov-theme/Dropdown";
import { useMemo, useState } from "react";
import SelectParentComponentProps from "./SelectParentComponentProps";

export interface EntitySchema {
  list: [{ rowId: any }];
  displayField: string;
  placeholder: string;
  label: string;
}

const SelectParentWidget: React.FunctionComponent<
  SelectParentComponentProps
> = ({
  id,
  onChange,
  required,
  uiSchema,
  value,
  parent,
  child,
  foreignKey,
}) => {
  const parentValue = child.list.find((opt) => opt.rowId == parseInt(value))?.[
    foreignKey
  ];
  const [selectedParentId, setSelectedParentId] = useState(parentValue);

  const onParentChange = (val) => {
    setSelectedParentId(parseInt(val));
  };

  let childOptions = useMemo(() => {
    return child.list.filter((opt) => {
      return opt[foreignKey] === selectedParentId;
    });
  }, [child, foreignKey, selectedParentId]);

  return (
    <>
      <label htmlFor={`select-parent-dropdown-${id}`}>{parent.label}</label>
      <Dropdown
        id={`select-parent-dropdown-${id}`}
        onChange={(e) => onParentChange(e.target.value || undefined)}
        size={(uiSchema && uiSchema["bcgov:size"]) || "large"}
        required={required}
        value={selectedParentId}
      >
        <option key={`option-placeholder-${id}`} value={undefined}>
          {parent.placeholder}
        </option>
        {parent.list.map((opt) => {
          return (
            <option key={opt.rowId} value={opt.rowId}>
              {opt[parent.displayField]}
            </option>
          );
        })}
      </Dropdown>

      <label htmlFor={`select-child-dropdown-${id}`}>{child.label}</label>
      <Dropdown
        id={`select-child-dropdown-${id}`}
        onChange={(e) => onChange(e.target.value || undefined)}
        size={(uiSchema && uiSchema["bcgov:size"]) || "large"}
        required={required}
        value={value}
      >
        <option key={`option-placeholder-${id}`} value={undefined}>
          {child.placeholder}
        </option>
        {childOptions.map((opt) => {
          return (
            <option key={opt.rowId} value={opt.rowId}>
              {opt[child.displayField]}
            </option>
          );
        })}
      </Dropdown>
      <style jsx>
        {`
          :global(input) {
            width: 100%;
          }
        `}
      </style>
    </>
  );
};

export default SelectParentWidget;
