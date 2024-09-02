import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-github";
import {useRef} from "react";

const YAMLEditor = ({ content, onChange }) => {
    const {current: fieldId} = useRef("YAML_EDITOR-" + (Math.random().toString(36)+'00000000000000000').slice(2, 7))
    return (
        <AceEditor
            mode="yaml"
            theme="github"
            value={content}
            onChange={onChange}
            name={fieldId}
            setOptions={{ useWorker: false }}
            editorProps={{ $blockScrolling: true }}
            focus
            width={"70vw"}
            wrapEnabled={false}
            showPrintMargin={false}
        />
    );
};

export default YAMLEditor;