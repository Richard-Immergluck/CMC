import React from 'react'
import Input from './Input'
import FileInput from './FileInput'
import MoneyInput from './MoneyInput'

function FormikControl(props) {
  const { control, ...rest } = props
  switch (control) {
    case 'input':
      return <Input {...rest} />
    case 'moneyInput':
      return <MoneyInput {...rest} />
    case 'fileInput':
      return <FileInput {...rest} />
    default:
      return null
  }
}

export default FormikControl
