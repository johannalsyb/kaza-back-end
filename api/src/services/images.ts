import sharp from "sharp"
import decode from "heic-decode"

export const resize = async (buffer: Buffer | ArrayBuffer, width: number, height?: number) => {
    let sharpB:sharp.Sharp

    /* HEIC Format */
    if(Buffer.isBuffer(buffer) && buffer.subarray(0,12).compare(Buffer.from([0x00, 0x00, 0x00, 0x28, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63])) === 0) {
        const data = await decode({buffer});
        sharpB = sharp(Buffer.from(data.data), {
            raw: {
                width: data.width,
                height: data.height,
                channels: 4
            }
        })
    } else {
        sharpB = sharp(buffer)
    }
    return sharpB.resize(width, height, {fit: "contain"}).webp().toBuffer()
}

export const rotate = async (url: string, degrees: number) => {
    let sharpB:sharp.Sharp
    if(url.startsWith("http")) {
        const buffer = await fetch(url).then(res => res.arrayBuffer()).then(b => Buffer.from(b))
        sharpB = sharp(buffer)
    } else {
        sharpB = sharp(Buffer.from(url))
    }
    return sharpB.rotate(degrees).webp().toBuffer()
}
