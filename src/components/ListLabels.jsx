import Badge from "react-bootstrap/Badge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Button from "react-bootstrap/Button";
import React from "react";
import UpdatingPopover from "./UpdatingPopover";

function ListLabels({labels, addFilters, selector, newLine}) {
    const badgeElement = (label, idx) => {
        const badgeProps = {
            pill: true,
            bg: "light",
            text: "dark",
            style: { marginRight: newLine ? "0em" : "1em" },
        };

        if (!selector) {
            badgeProps.style.cursor = "pointer";
            badgeProps.onClick = () => addFilters(label);
        }

        // If idx is provided, include it as the key.
        if (idx !== undefined) {
            badgeProps.key = idx;
        }

        return <Badge {...badgeProps}>{label}</Badge>;
    };
    const labelsWithWrappers = labels?.map((label, idx) => (
        <div key={idx}>{badgeElement(label)}</div>
    ));
    const labelsWithoutWrappers = labels?.map(badgeElement);
    const labelsToDisplay = newLine ? labelsWithWrappers : labelsWithoutWrappers;

    return (
        <>
            {labelsToDisplay?.slice(0, 2)}
            {labels?.length > 2 && (
                <OverlayTrigger
                    trigger="click"
                    placement="right"
                    overlay={
                        <UpdatingPopover>
                            {labelsWithWrappers?.slice(2)}
                        </UpdatingPopover>
                    }
                    rootClose
                    rootCloseEvent={"mousedown"}
                >
                    <Button variant="primary" size="sm">
                        More <Badge bg="secondary">+{labels?.length - 2}</Badge>
                        <span className="visually-hidden">more labels</span>
                    </Button>
                </OverlayTrigger>
            )}
        </>
    )
}

export default ListLabels;