import React ,{useState} from 'react';

const SecureS3Upload = () => {

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileInput = (e) => setSelectedFile(e.target.files[0]);

    const uploadFile = (file) => {

        const requestObject = {
            method:'POST' ,
            body:{
                fileName: file.name ,
                fileType: file.type
            }
        }

        fetch('/api/download',requestObject)
            .then(res => {
            fetch(res.signedUrl , {
                method:'PUT',
                body :file
            }).then((res) => {
                // DO WHATEVER YOU WANT
                console.log(res)
            })
        })

    }


    return <>
        <input type="file" onChange={handleFileInput}/>
        <button onClick={() => uploadFile(selectedFile)}> Upload to S3</button>
    </>
}

export default SecureS3Upload;