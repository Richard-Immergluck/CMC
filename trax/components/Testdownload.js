import { useEffect, useRef, useState } from 'react'
import Amplify from '@aws-amplify/core'
import { Storage } from 'aws-amplify'

function TestDownload() {
  const ref = useRef(null)
  const [files, setFiles] = useState([])
  const [download, setDownload] = useState(null)

  useEffect(() => {
    Amplify.configure({
      Auth: {
        identityPoolId: 'us-east-1:bb0acdff-0037-4c7b-855b-5b1e0b28ea2e',
        region: 'us-east-1'
      },

      Storage: {
        AWSS3: {
          bucket: 'cbc-track-storage-bucket',
          region: 'eu-west-2'
        }
      }
    })
  }, [])

  useEffect(() => {
    Storage.list('')
      .then(files => {
        setFiles(files)
      })

      .catch(err => {
        console.log(err)
      })
  }, [])

  const handleFileLoad = () => {
    const fileName = ref.current.files[0].name
    Storage.put(fileName, ref.current.files[0])
      .then(resp => {
        console.log(resp)
      })
      .catch(err => {
        console.log(err)
      })
  }

  useEffect(() => {}, [])

  const handleDownload = file => {
    Storage.get(file)
      .then(resp => {
        console.log(resp)
        setDownload(resp)
      })
      .catch(err => {
        console.log(err)
      })
    return download
  }

  const handleDelete = file => {
    Storage.remove(file)
      .then(resp => {
        console.log(resp)
        loadImages()
      })
      .catch(err => {
        console.log(err)
      })
    return resp
  }

  return (
    <div>
      <h1>Download Test Page</h1>
      <input ref={ref} type='file' onChange={handleFileLoad} />
      <table>
        <thead>
          <tr>
            <td>Name</td>
            <td>Action</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file.key}>
              <td>{file.key}</td>
              <td>
                <button onClick={() => handleDownload(file.key)}>
                  Download
                </button>
                <button onClick={() => handleDelete(file.key)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TestDownload
