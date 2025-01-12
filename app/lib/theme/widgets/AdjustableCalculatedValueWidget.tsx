import { WidgetProps } from "@rjsf/core";
import NumberFormat from "react-number-format";

export const AdjustableCalculatedValueWidget: React.FC<WidgetProps> = (
  props
) => {
  const {
    schema,
    uiSchema,
    id,
    disabled,
    label,
    onChange,
    value,
    formContext,
  } = props;

  // If we are using this widget to show numbers as money or percent, we can set `isMoney` or `isPercentage` to true in the uiSchema.
  const isMoney = uiSchema?.isMoney;
  const isPercentage = uiSchema?.isPercentage;

  // If we need to set the amount of decimal places, we can set it in the uiSchema, otherwise there will be no decimal places.
  const numberOfDecimalPlaces = isMoney
    ? 2
    : uiSchema.numberOfDecimalPlaces ?? 0;

  const calculatedValue =
    formContext[uiSchema.calculatedValueFormContextProperty];

  const adjustedInputId = `${id}_adjusted`;

  return (
    <div>
      {calculatedValue !== null && calculatedValue !== undefined && (
        <>
          <div className="readonly">
            <NumberFormat
              thousandSeparator
              fixedDecimalScale={numberOfDecimalPlaces}
              decimalScale={numberOfDecimalPlaces}
              id={id}
              prefix={isMoney ? "$" : ""}
              suffix={isPercentage ? "%" : ""}
              disabled={disabled}
              className="adjustable"
              defaultValue={(schema as any).defaultValue}
              value={calculatedValue}
              displayType="text"
              // This is required since we render a <span> component
              aria-label={label}
            />
          </div>
          <div>
            <label htmlFor={adjustedInputId}>{label} (Adjusted)</label>
          </div>
        </>
      )}
      <NumberFormat
        thousandSeparator
        fixedDecimalScale={isMoney || isPercentage}
        id={adjustedInputId}
        prefix={isMoney ? "$" : ""}
        suffix={isPercentage ? "%" : ""}
        disabled={disabled}
        className="adjustable"
        decimalScale={isMoney || isPercentage ? 2 : 10} //Hardcoded for now, we can change it if we need toma as any).defaultValue}
        value={value}
        onValueChange={({ floatValue }) => {
          if (
            Number.isNaN(floatValue) ||
            floatValue === undefined ||
            floatValue === null
          ) {
            onChange(undefined);
          } else {
            onChange(((floatValue * 100) / 100).toFixed(isMoney ? 2 : 10)); //Hardcoded for now, we can change it if we need to
          }
        }}
        style={{
          border: "2px solid #606060",
          borderRadius: "0.25em",
          padding: "0.5em",
        }}
        aria-label={`${label} (Adjusted)`}
      />
      <style jsx>
        {`
          .readonly {
            margin-bottom: 1em;
          }
          div :global(input) {
            width: 100%;
          }
          div :global(.adjustable:focus) {
            outline-style: solid;
            outline-width: 4px;
            outline-color: #3b99fc;
            outline-offset: 1px;
          }
        `}
      </style>
    </div>
  );
};
