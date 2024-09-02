import {useContext, useEffect, useRef, useState} from "react";
import Terminal, {ColorMode, TerminalOutput} from 'react-terminal-ui';

import './TerminalController.css'
import {ErrorHandlingToastContext} from "../ErrorHandlingToastContext";
import Button from "react-bootstrap/Button";

const mergeUnique = (arr1, arr2) => {
    const mergedArray = arr1.concat(arr2);

    // Create a map to track unique items by their time
    return mergedArray.filter(
        (item, index, self) =>
            index === self.findIndex((t) => t.time === item.time)
    );
};

const TerminalController = ({terminalControllerShow, setTerminalControllerShow, terminalControllerShowMinimized, setTerminalControllerShowMinimized}) => {
    const errorHandler = useContext(ErrorHandlingToastContext)
    const [terminalLineData, setTerminalLineData] = useState([]);
    const [terminalLogs, setTerminalLogs] = useState([]);
    const terminalRef = useRef(null);
    const shouldScrollRef = useRef(true);

    useEffect(() => {

        // Create a new EventSource instance to listen to the SSE endpoint
        const eventSource = new EventSource('https://localhost/lac');

        // Listen for messages (events) from the server
        eventSource.onmessage = (event) => {
            if (terminalRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
                shouldScrollRef.current = scrollTop + clientHeight >= scrollHeight - 10; // small threshold
            }

            // Parse the event data (which should be in JSON format)
            const newLogs = JSON.parse(event.data);
            const uniqueLogs = mergeUnique(terminalLogs, newLogs)
            let terminalLines = [];
            uniqueLogs.forEach((element) => {
                terminalLines.push(<TerminalOutput key={element.time}>[{element.time}][{element.type}]: {element.message}</TerminalOutput>)
            });
            setTerminalLineData(terminalLines);
            setTerminalLogs(uniqueLogs);
        };

        // Handle errors (e.g., server disconnected, network issues)
        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            errorHandler.addToast('EventSource failed: ' + error, 'danger');
            eventSource.close(); // Close the connection if there’s an error
        };

        // Cleanup when the component is unmounted
        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        // Scroll to the bottom when new content is added
        if (shouldScrollRef.current && terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLineData]);

    return (
        <div className={`custom-terminal-wrapper ${terminalControllerShowMinimized ? 'minimized' : ''}`} hidden={!terminalControllerShow}>
            <Terminal name='Activity Console' colorMode={ColorMode.Dark} height='100pt'
                      redBtnCallback={() => setTerminalControllerShow(false)}
                      yellowBtnCallback={() => setTerminalControllerShowMinimized(true)}
                      greenBtnCallback={() => setTerminalControllerShowMinimized(false)}>
                <div ref={terminalRef} className="terminal-content">
                    <Button variant="secondary" size="sm">Load more logs</Button>
                    {terminalLineData}
                    <TerminalOutput>
                        <div className="terminal-loading">Receiving events...</div>
                    </TerminalOutput>
                </div>
            </Terminal>
        </div>
)
};

export default TerminalController;
