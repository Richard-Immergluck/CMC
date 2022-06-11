import React from "react";
import Input from "./Input";
import FileInput from "./FileInput";

function FormikControl(props) {
  const { control, ...rest } = props;
  switch (control) {
    case "input":
      return <Input {...rest} />;
    case "fileInput":
      return <FileInput {...rest} />;
    default:
      return null;
  }
}

export default FormikControl;
