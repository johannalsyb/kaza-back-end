import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { Props } from ".";
import { Pressable, StyleSheet, View } from "react-native";
import variables from "../../styles/variables";
import KIcon from "../KIcon/KIcon";
import useIsMobile from "../../hooks/useIsMobile";
import { createRef, useEffect } from "react";

import "./index.css"

const arrow = (position: "left" | "right", clickHandler:() => void) => <Pressable
    style={{
        height: "100%",
        display: "flex",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        left: position === "left" ? 0 : undefined,
        right: position === "right" ? 0 : undefined,
        zIndex: 2,
        paddingLeft: position === "left" ? 5 : undefined,
        paddingRight: position === "right" ? 5 : undefined,
    }}
    onPress={() => clickHandler()}>
        <KIcon
            style={styles.arrow}
            name={position === "left" ? "chevronLeft" : "chevronRight"}
            size="medium"
        />
</Pressable>

export default (props:Props) => {
    const {isMobile} = useIsMobile()
    const ref = createRef<Carousel>()

    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                // props.onChange(props.selectedItem - 1, props.children[props.selectedItem - 1])
                ref.current?.decrement()
            } else if (e.key === "ArrowRight") {
                // props.onChange(props.selectedItem + 1, props.children[props.selectedItem + 1])
                ref.current?.increment()
            }
        }
        document.addEventListener("keydown", listener)

        return () => {
            document.removeEventListener("keydown", listener)
        }
    })

    return <Carousel
        ref={ref}
        emulateTouch={isMobile}
        showArrows={true}
        // dynamicHeight={true}
        showThumbs={false}
        onChange={e => {
            // console.log(e)
        }}
        showStatus={false}
        renderArrowPrev={(c) => arrow("left", c)}
        renderArrowNext={(c) => arrow("right", c)}
        width={"100%"}
        infiniteLoop={true}
        >
        {props.data.map((item, index) => item)}
    </Carousel>;
}

const styles = StyleSheet.create({
    arrow: {
      backgroundColor: variables.colors.yellow,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
      pointerEvents: "all",
    },
});