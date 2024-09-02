import {useContext, useEffect, useState} from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import {Trash} from "react-bootstrap-icons";
import InputGroup from 'react-bootstrap/InputGroup';

import DAGDiagram from "../../../components/DAGDiagram";
import YAMLEditor from "../../../components/YAMLEditor";
import JSONDisplayTree from "../../../components/JSONDisplayTree";
import Spinner from "react-bootstrap/Spinner";
import GetApiRequest from "../../../components/GetApiRequest";

import {ErrorHandlingToastContext} from '../../../ErrorHandlingToastContext';
import ListLabels from "../../../components/ListLabels";
import PostApiRequest from "../../../components/PostApiRequest";

function DeploymentOverview({show, close, addFilters, configID, cluster, ns, deploymentName, setTerminalControllerShow, setTerminalControllerShowMinimized}) {
    const errorHandler = useContext(ErrorHandlingToastContext)
    const [selectedTab, setSelectedTab] = useState('summary');
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState({
        scale: 1,
        initialScale: 1,
        deploymentData: {},
    });

    useEffect(() => {
        if (show) {
            setLoading(true);
            GetApiRequest(
                '/getK8sdeploymentInfo/' + configID + "/" + cluster + "/" + ns + "/" + deploymentName,
                'deploymentInfo',
                data => {
                    setState(prevState => ({
                        ...prevState,
                        deploymentData: data,
                        scale: data.summary.configuration.replicas,
                        initialScale: data.summary.configuration.replicas,
                    }));
                    setLoading(false);
                },
                error => {
                    errorHandler.addToast(error, 'danger');
                }
            )
        }
    }, [show]);

    const maxScaleValue = () => {
        let scaleValue = state.initialScale * 5;
        if (scaleValue === 0) {
            scaleValue = 5
        }
        return (scaleValue)
    }

    const handleScaleChange = event => {
        const newScale = parseInt(event.target.value, 10);
        setState(prevState => ({
            ...prevState,
            scale: newScale
        }));
    };

    const handleScaleClick = () => {
        PostApiRequest(
            '/scaleDeployment/' + configID + "/" + cluster + "/" + ns + "/" + deploymentName,
            {scale: state.scale},
            'scale deployment',
            () => {
                setState(prevState => ({
                    ...prevState,
                    initialScale: state.scale
                }));
                setTerminalControllerShow(true);
                setTerminalControllerShowMinimized(false);
            },
            error => {
                errorHandler.addToast(error, 'danger');
            }
        )
    };

    const onYAMLChange = (content) => {
        console.log(content);
    }

    return (
        <Modal
            show={show}
            onHide={close}
            backdrop="static"
            keyboard={false}
            size={"xl"}
        >
            <Modal.Header closeButton>
                <Modal.Title>Deployment - {deploymentName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading &&
                    <div className={"text-center"}><Spinner animation="border" variant="primary" /></div>
                }
                {!loading &&
                <Tabs
                    defaultActiveKey="summary"
                    className="mb-3"
                    justify
                    onSelect={(k) => setSelectedTab(k)}
                >
                    <Tab eventKey="summary" title="Summary">
                        <Row xs={1} md={2} className="g-4">
                            <Col>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>Configuration</Card.Title>
                                        <Row>
                                            <Col xs={5}>Deployment Strategy</Col>
                                            <Col xs={7}>{state.deploymentData.summary.configuration.ds}</Col>
                                        </Row>
                                        <Row>
                                            <Col xs={5}>Replicas</Col>
                                            <Col xs={2}
                                                 style={{color: state.scale !== state.initialScale ? 'green' : 'black'}}>
                                                {state.scale}
                                            </Col>
                                            <Col xs={3}><Form.Range value={state.scale} max={maxScaleValue()}
                                                                    onChange={handleScaleChange}/></Col>
                                            <Col xs={2}><Button size={"sm"}
                                                                variant={"outline-warning"} onClick={handleScaleClick}
                                                                disabled={state.scale === state.initialScale}>Scale</Button></Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>Status</Card.Title>
                                        <Row>
                                            <Col>Available Replicas</Col>
                                            <Col xs={7}>{state.deploymentData.summary.status.available_replicas}</Col>
                                        </Row>
                                        <Row>
                                            <Col>Ready Replicas</Col>
                                            <Col xs={7}>{state.deploymentData.summary.status.ready_replicas}</Col>
                                        </Row>
                                        <Row>
                                            <Col>Total Replicas</Col>
                                            <Col xs={7}>{state.deploymentData.summary.status.total_replicas}</Col>
                                        </Row>
                                        <Row>
                                            <Col>Unavailable Replicas</Col>
                                            <Col xs={7}>{state.deploymentData.summary.status.unavailable_replicas}</Col>
                                        </Row>
                                        <Row>
                                            <Col>Updated Replicas</Col>
                                            <Col xs={7}>{state.deploymentData.summary.status.updated_replicas}</Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <h4>Pods&nbsp;</h4><ListLabels addFilters={addFilters} selector={false}
                                                      labels={state.deploymentData.summary.pod_selectors}
                                                      newLine={false}/>
                        </div>
                            <Table striped bordered hover>
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Ready</th>
                                    <th>Phase</th>
                                    <th>Status</th>
                                    <th>Restarts</th>
                                    <th>Node</th>
                                    <th>Age</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {state.deploymentData.summary.pods?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.name}</td>
                                        <td>{item.ready}/{item.ready_desired}</td>
                                        <td>{item.phase}</td>
                                        <td>{item.status}</td>
                                        <td>{item.restarts}</td>
                                        <td>{item.node}</td>
                                        <td>{item.age}</td>
                                        <td className={"text-center"} style={{verticalAlign: "middle"}}>
                                            <Button size={"sm"} variant={"outline-danger"}><Trash/></Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                            <h4>Pod Template</h4>
                            {state.deploymentData.summary.template?.map((item, idx) => (
                            <Card key={idx} className={"mb-3"}>
                                <Card.Body style={{lineHeight: "35pt"}}>
                                    <h4>Container {item.container_name}</h4>
                                    <Row>
                                        <Col xs={2}><b>Image</b></Col>
                                        <Col xs={10}>
                                            <InputGroup size={"sm"}>
                                                <Form.Control
                                                    disabled
                                                    value={item.image}
                                                />
                                                <Button variant="outline-warning">
                                                    Edit
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2}><b>Container Ports</b></Col>
                                        <Col xs={10}>
                                            {item.ports?.map((port, idx) => (
                                            <div key={idx}>{port.port}/{port.protocol} <Button size={"sm"} variant="outline-primary">Start Port
                                                Forward</Button></div>
                                            ))}
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2}><b>Environment</b></Col>
                                        <Col xs={10}>
                                            <Table bordered size="sm">
                                                <tbody>
                                                {item.environment?.map((env, idx) => (
                                                <tr key={idx}>
                                                    <td style={{wordBreak: "break-all"}}>{env.name}</td>
                                                    <td style={{wordBreak: "break-all"}}>{env.value}</td>
                                                    <td>{env.source}</td>
                                                </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col xs={2}><b>Volume Mounts</b></Col>
                                        <Col xs={10}>
                                            <Table bordered size="sm">
                                                <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Mount Path</th>
                                                    <th>Propagation</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {item.volume?.map((vol, idx) => (
                                                <tr key={idx}>
                                                    <td>{vol.name}</td>
                                                    <td style={{wordBreak: "break-all"}}>{vol.path}</td>
                                                    <td>{vol.propagation}</td>
                                                </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            ))}
                            <h4>Volumes</h4>
                            <Table striped bordered hover size="sm">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Kind</th>
                                    <th>Description</th>
                                </tr>
                                </thead>
                                <tbody>
                                {state.deploymentData.summary.volumes?.map((vol, idx) => (
                                <tr key={idx}>
                                    <td>{vol.name}</td>
                                    <td>{vol.kind}</td>
                                    <td style={{wordBreak: "break-all"}}>{vol.description}</td>
                                </tr>
                                ))}
                                </tbody>
                            </Table>
                            <h4>Conditions</h4>
                            <Table striped bordered hover size="sm">
                                <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Message</th>
                                    <th>Last Update</th>
                                    <th>Last Transition</th>
                                </tr>
                                </thead>
                                <tbody>
                                {state.deploymentData.summary.conditions?.map((cond, idx) => (
                                <tr key={idx}>
                                    <td>{cond.type}</td>
                                    <td>{cond.reason}</td>
                                    <td>{cond.status}</td>
                                    <td>{cond.message}</td>
                                    <td>{cond.last_update}</td>
                                    <td>{cond.last_transition}</td>
                                </tr>
                                ))}
                                </tbody>
                            </Table>
                            <h4>Events</h4>
                            <Table striped bordered hover size="sm">
                                <thead>
                                <tr>
                                    <th>Reason</th>
                                    <th>Message</th>
                                </tr>
                                </thead>
                                <tbody>
                                {state.deploymentData.summary.events?.map((event, idx) => (
                                <tr key={idx}>
                                    <td>{event.reason}</td>
                                    <td>{event.message}</td>
                                </tr>
                                ))}
                                </tbody>
                            </Table>
                    </Tab>
                    <Tab eventKey="metadata" title="Metadata">
                        <Card>
                            <Card.Body style={{lineHeight: "35pt"}}>
                                <Card.Title>Metadata</Card.Title>
                                <Row>
                                    <Col xs={2}><b>Age</b></Col>
                                    <Col xs={10}>{state.deploymentData.metadata.age}</Col>
                                </Row>
                                <Row>
                                    <Col xs={2}><b>Labels</b></Col>
                                    <Col xs={10}><ListLabels addFilters={addFilters} selector={false}
                                                             labels={state.deploymentData.metadata.labels}
                                                             newLine={false}/></Col>
                                </Row>
                                <Row>
                                    <Col xs={2}><b>Annotations</b></Col>
                                    <Col xs={10}><ListLabels selector={true}
                                                             labels={state.deploymentData.metadata.annotations}
                                                             newLine={false}/></Col>
                                </Row>
                            </Card.Body>
                        </Card>
                        {state.deploymentData.metadata.custom?.map((custom, idx) => (
                        <Card key={idx} className={"mt-3"}>
                            <Card.Body style={{lineHeight: "35pt"}}>
                                <Card.Title>{custom.name}</Card.Title>
                                <Row>
                                    <Col xs={2}><b>Operation</b></Col>
                                    <Col xs={10}>{custom.operation}</Col>
                                </Row>
                                <Row>
                                    <Col xs={2}><b>Updated</b></Col>
                                    <Col xs={10}>{custom.updated}</Col>
                                </Row>
                                <Row>
                                    <Col xs={2}><b>Fields</b></Col>
                                    <Col xs={10}>
                                        <JSONDisplayTree data={JSON.parse(custom.fields)}/>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                        ))}
                    </Tab>
                    <Tab eventKey="resource-viewer" title="Resource Viewer">
                        {selectedTab === 'resource-viewer' && <DAGDiagram data={state.deploymentData.graph}/>}
                    </Tab>
                    <Tab eventKey="yaml" title="YAML">
                        <YAMLEditor onChange={onYAMLChange} content={state.deploymentData.yaml}/>
                    </Tab>
                </Tabs>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={close}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default DeploymentOverview;