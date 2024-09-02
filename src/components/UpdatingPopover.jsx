import React, {useEffect} from "react";
import Popover from "react-bootstrap/Popover";

const UpdatingPopover = React.forwardRef(
    ({ popper, children, show: _, ...props }, ref) => {
        useEffect(() => {
            popper.scheduleUpdate();
        }, [children, popper]);

        return (
            <Popover ref={ref} body {...props}>
                {children}
            </Popover>
        );
    },
);

export default UpdatingPopover;