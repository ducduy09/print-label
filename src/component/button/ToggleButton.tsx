import React, { useState } from "react";

export default function ToggleButton({ 
    defaultValue = false, 
    onChange = (newValue: boolean) => {} 
}) {
    const [checked, setChecked] = useState(defaultValue);

    const toggle = () => {
        const newValue = !checked;
        setChecked(newValue);
        onChange(newValue);
    };

    return (
        <div
            onClick={toggle}
            style={{
                width: "50px",
                height: "26px",
                borderRadius: "30px",
                background: checked ? "#4ade80" : "#d1d5db",
                position: "relative",
                cursor: "pointer",
                transition: "0.25s",
                display: "flex",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    width: "22px",
                    height: "22px",
                    background: "white",
                    borderRadius: "50%",
                    position: "absolute",
                    left: checked ? "26px" : "2px",
                    transition: "0.25s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
            />
        </div>
    );
}
