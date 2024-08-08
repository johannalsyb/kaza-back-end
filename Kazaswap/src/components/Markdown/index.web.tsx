import { useEffect, useRef } from "react";

declare global {
    interface Window {
      marked: any;
    }
  }

type Props = {
    children: string
}

export default (props:Props) => {
    const ref = useRef<HTMLDivElement>(null);

    const parse = (md:string):string => window.marked.parse(md);

    // useEffect(() => {
    //     if(!ref.current) return;
    //     const el = ref.current;
    //     const html = el.innerHTML;
    //     const markdown = window.marked.parse(html);
    //     el.innerHTML = markdown;
    // }, [ref.current]);

    useEffect(() => {
        if(!ref.current) return;
        const el = ref.current;
        el.innerHTML = parse(props.children);
    }, [ref.current, props.children]);

    return <div ref={ref} />
}