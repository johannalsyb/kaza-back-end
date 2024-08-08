import { useEffect, useState } from "react"

// const useFileDataUrl = (file?: File) => {
//     const [url, setUrl] = useState<string>()
  
//     useEffect(() => {
//       if (!file) return
//       let aborted = false
//       const reader = new FileReader()
//       reader.onload = () => !aborted && setUrl(reader.result as string)
//       reader.readAsDataURL(file)
//       return () => {
//         aborted = true
//       }
//     }, [file])
  
//     return {
//       url,
//     }
// }

const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (err) => reject(err)
        reader.readAsDataURL(file)
    })

const dataUrlToFile = async (dataUrl: string, filename: string, mimeType: string) => {
    const response = await fetch(dataUrl)
    const buf = await response.arrayBuffer()
    return new File([buf], filename, { type: mimeType })
}

export const resizeImage = async (fileB64: string, maxEdgePx: number) => {
    return new Promise<string>((resolve, reject) => {
        let imgSource:Promise<string | null | void>
        if(fileB64.startsWith("data:image/heic")) {
            //@ts-expect-error
            const heif = libheif()
            const decoder = new heif.HeifDecoder();
            imgSource = dataUrlToFile(fileB64, "heic.heic", "image/heic")
            .then(file => file.arrayBuffer())
            .then(buffer => {
                const data = decoder.decode(buffer);
                // data in an array holding all images inside the heic file
                const image = data[0];
                const nwidth = image.get_width();
                const nheight = image.get_height();

                // Create the in-memory canvas and set its dimensions
                const canvasHeic = document.createElement('canvas')
                canvasHeic.width = nwidth
                canvasHeic.height = nheight
                // Get a 2d context and set the image smoothing quality. This is
                // used to perform drawing operations on the canvas.
                const context = canvasHeic.getContext('2d')
                if (context == null)    return reject(new Error("Can't obtain canvas context"))
                // context.imageSmoothingQuality = 'high'
        
                const imageData = context.createImageData(nwidth, nheight);
                return new Promise<[ImageData, {data:any}]>((rresolve, rreject) => {
                    image.display(imageData, (displayData:{data:any}) => {
                        if (!displayData) {
                            return rreject(new Error('HEIF processing error'));
                        }
                        rresolve([imageData, displayData]);
                    });
                })
                .then(([imageData, _displayData]) => {
                    context.putImageData(imageData, 0, 0)
                    const dataUrl = canvasHeic.toDataURL('image/webp')
                    // console.log("HEIC convert to Webp:", fileB64.length/1024/1024, " => ", dataUrl.length/1024/1024, "ratio:", (1-(dataUrl.length/fileB64.length))*100+"%")
                    return dataUrl
                })
            })
        } else imgSource = Promise.resolve(fileB64)

        // Create the image and put the code to perform the resize in onload
        const image = new Image()
        image.onload = async () => {
            try {
                // Calculate the size of the resized image
                const { width, height } =
                image.width > image.height
                    ? {
                        width: maxEdgePx,
                        height: (maxEdgePx / image.width) * image.height,
                    }
                    : {
                        width: (maxEdgePx / image.height) * image.width,
                        height: maxEdgePx,
                    }
                // Create the in-memory canvas and set its dimensions
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                // Get a 2d context and set the image smoothing quality. This is
                // used to perform drawing operations on the canvas.
                const context = canvas.getContext('2d')
                if (context == null)    return reject(new Error("Can't obtain canvas context"))
                context.imageSmoothingQuality = 'high'
                // Draw the original image on our canvas. The dimensions have
                // the same aspect ratio, so draw the entire original image to
                // the entire canvas.
                context.drawImage(
                    image, // source image
                    0, // source x, y, width, height
                    0,
                    image.width,
                    image.height,
                    0, // destination x, y, width height
                    0,
                    width,
                    height
                )

                // Convert the canvas back to a File and store it in the state. 
                // webp was chosen as it generally results in smaller file sizes
                // than png and jpg, and supports transparency.
                const dataUrl = canvas.toDataURL('image/webp')
                // const resizedFile = await dataUrlToFile(
                //     dataUrl,
                //     'resized.webp',
                //     'image/webp'
                // )

                // console.log("resizing:", fileB64.length/1024/1024, " => ", dataUrl.length/1024/1024, "ratio:", (1-(dataUrl.length/fileB64.length))*100+"%")

                resolve(dataUrl)
            } catch (e) {
                console.error(e)
                // reject(e)
            }
        }

        // Set the image src to the data url. This triggers the onload
        // function as soon as the url is loaded
        imgSource.then(i => {
            if(i) {
                image.src = i
            } else {
                console.error("Image not ready")
            }
        })
    })
}

const useResizeImage = ({
    file,
    maxEdgePx,
}: {
    file: File | string
    maxEdgePx: number
}) => {
    // // Convert the file to a data url
    // const { url } = useFileDataUrl(file)
    const [url, setUrl] = useState<string | undefined>(typeof file === "string" ? file : undefined)
    // The final resized image
    const [resizedImageFile, setResizedImageFile] = useState<File>()

    useEffect(() => {
        if(!url && file instanceof File) {
            fileToDataUrl(file)
            .then((url) => {
                setUrl(url)
            })
            .catch((e) => {
                console.error(e)
            })
        }
    }, [])
  
    useEffect(() => {
      if (!url) return
      // A flag to prevent out-or-order errors
      let aborted = false
  
      // Create the image and put the code to perform the resize in onload
      const image = new Image()
      image.onload = async () => {
        if (aborted) return
  
        // Calculate the size of the resized image
        const { width, height } =
          image.width > image.height
            ? {
                width: maxEdgePx,
                height: (maxEdgePx / image.width) * image.height,
              }
            : {
                width: (maxEdgePx / image.height) * image.width,
                height: maxEdgePx,
              }
  
        // Create the in-memory canvas and set its dimensions
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
  
        // Get a 2d context and set the image smoothing quality. This is
        // used to perform drawing operations on the canvas.
        const context = canvas.getContext('2d')
        if (context == null)
          throw new Error("Can't obtain canvas context")
        context.imageSmoothingQuality = 'high'
  
        // Draw the original image on our canvas. The dimensions have
        // the same aspect ratio, so draw the entire original image to
        // the entire canvas.
        context.drawImage(
          image, // source image
          0, // source x, y, width, height
          0,
          image.width,
          image.height,
          0, // destination x, y, width height
          0,
          width,
          height
        )
  
        // Convert the canvas back to a File and store it in the state. 
        // webp was chosen as it generally results in smaller file sizes
        // than png and jpg, and supports transparency.
        const dataUrl = canvas.toDataURL('image/webp')
        const resizedFile = await dataUrlToFile(
          dataUrl,
          'resized.webp',
          'image/webp'
        )
        if (aborted) return
        setResizedImageFile(resizedFile)
      }
  
      // Set the image src to the data url. This triggers the onload
      // function as soon as the url is loaded
      image.src = url
  
      // If one of the props changes before the resize completes then
      // abort in case this run completes after a subsequent one and
      // overwrites the result.
      return () => {
        aborted = true
      }
    }, [maxEdgePx, url])
  
    // The hook returns the resized image file
    return {
      resizedImageFile,
    }
}

export default useResizeImage