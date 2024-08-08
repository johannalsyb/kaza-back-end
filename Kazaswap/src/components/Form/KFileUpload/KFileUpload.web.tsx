import { ForwardedRef, forwardRef, useImperativeHandle } from "react"

import { Handle, Props } from ".";
import useConfig from "../../../hooks/useConfig";
import { toastWarning } from "../../Toast/Toast";

export default forwardRef<Handle, Props>(({
    onFiles,
    accept = "image/*",
    multiple = false,
    max = 1
},
ref: ForwardedRef<any>) => {
    const {config} = useConfig()
    const id = Math.random().toString(36).substring(7);

    useImperativeHandle(ref, () => ({
        open: () => {
            //@ts-ignore
            const input = document.getElementById(`image-picker-${id}`);
            if(input) {
                input.click();
            }
        }
    }));

    return <input
        ref={ref}
        hidden={true}
        style={{
            display: 'none',
        }}
        id={`image-picker-${id}`}
        type="file"
        accept={accept}
        multiple={multiple}
        max={max}
        onChange={(e) => {
            e.preventDefault();
            if(!e.target.files) return
            
            const promises = Array.from(e.target.files).map(f => { 
                const maxFileSize = (config?.upload.maxFileSizeMb || 50)
                if(f.size > maxFileSize * 1024 * 1024) {
                    toastWarning(`Maximum file size is ${maxFileSize}MB`)
                    return Promise.resolve(null)
                }
                return new Promise<string | null>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ee) => {
                        //@ts-ignore
                        const b64:string = ee.target.result.toString();
                        resolve(b64);
                    };
                    reader.onerror = (ee) => {
                        // reject(ee)
                        toastWarning(`Error reading file`)
                        resolve(null)
                    }
                    reader.readAsDataURL(f);
                })
            })
            Promise.all(promises)
            .then(ff => {
                const files = ff.filter(f => f !== null) as string[]
                onFiles(files)
            })
        }} />
})