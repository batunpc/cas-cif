import { WidgetProps } from "@rjsf/core";
import NumberFormat from "react-number-format";

const ReadOnlyCalculatedValueWidget: React.FC<WidgetProps> = ({
  id,
  formContext,
  label,
  uiSchema,
  message = "",
}) => {
  // If we are using this widget to show numbers as money or percent, we can set `isMoney` or `isPercentage` to true in the uiSchema.
  const isMoney = uiSchema?.isMoney;
  const isPercentage = uiSchema?.isPercentage;

  const calculatedValue =
    formContext[uiSchema.calculatedValueFormContextProperty];

  return (
    <>
      <dd aria-label={label}>
        {calculatedValue !== null && calculatedValue !== undefined ? (
          <NumberFormat
            fixedDecimalScale={isMoney || isPercentage}
            prefix={isMoney ? "$" : ""}
            suffix={isPercentage ? "%" : ""}
            id={id}
            decimalScale={isMoney || isPercentage ? 2 : 10} //Hardcoded for now, we can change it if we need to
            value={calculatedValue}
            displayType="text"
          />
        ) : (
          <em>{message}</em>
        )}
      </dd>
      <style jsx>{`
         {
          dd {
            margin-bottom: 0;
          }
        }
      `}</style>
    </>
  );
};

export default ReadOnlyCalculatedValueWidget;
