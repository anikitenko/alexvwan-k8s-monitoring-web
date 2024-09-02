import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';
import React, {useCallback, useContext, useEffect, useState} from "react";
import axios from "axios";
import {ErrorHandlingToastContext} from "./ErrorHandlingToastContext";
import Spinner from "react-bootstrap/Spinner";
import Table from 'react-bootstrap/Table';
import {Trash} from "react-bootstrap-icons";
import GetApiRequest from "./components/GetApiRequest";

const HomePageEditMode = ({showManageKubeconfigs, setShowManageKubeconfigs, switchToStandardMode}) => {
    const errorHandler = useContext(ErrorHandlingToastContext)
    const [kubeconfig, setKubeconfig] = useState(null);
    const [kubeconfigText, setKubeconfigText] = useState("");
    const [kubeconfigName, setKubeconfigName] = useState('');
    const [kubeconfigTypeName, setKubeconfigTypeName] = useState('File (click to switch to Text)');
    const [kubeconfigType, setKubeconfigType] = useState(false);
    const [kubeconfigTypeFile, setKubeconfigTypeFile] = useState(true);
    const [kubeconfigTypeText, setKubeconfigTypeText] = useState(false);
    const [kubeconfigsListLoading, setKubeconfigsListLoading] = useState(false);
    const [kubeconfigsList, setKubeconfigsList] = useState([]);
    const [kubeconfigsListShowClose, setKubeconfigsListShowClose] = useState(false);

    const [showAddKubeconfig, setShowAddKubeconfig] = useState(false);

    const kubeconfigTypeChange = () => {
        setKubeconfigType(!kubeconfigType)
        if (kubeconfigType) {
            setKubeconfigTypeName("File (click to switch to Text)")
            setKubeconfigTypeFile(true)
            setKubeconfigTypeText(false)
        } else {
            setKubeconfigTypeName("Text (click to switch to File)")
            setKubeconfigTypeText(true)
            setKubeconfigTypeFile(false)
        }
    }

    const handleKubeconfigNameChange = (e) => setKubeconfigName(e.target.value);
    const handleKubeconfigChange = (e) => setKubeconfig(e.target.files[0]);
    const handleKubeconfigTextChange = (e) => setKubeconfigText(e.target.value);
    const handleShowAddKubeconfig = () => setShowAddKubeconfig(true);
    const handleHideAddKubeconfig = () => {
        setShowAddKubeconfig(false);
        getKubeconfigs();
    }
    const handleHideManageKubeconfigs = () => {
        if (kubeconfigsList === null) {
            return
        }
        switchToStandardMode();
        setShowManageKubeconfigs(false);
    }
    const [rowDeleteID, setRowDeleteID] = useState('');
    const [showDelete, setShowDelete] = useState(false);
    const handleCloseShowDelete = () => setShowDelete(false);

    const deleteRow = (id) => {
        setRowDeleteID(id);
        setShowDelete(true);
    }

    const handleDelete = () => {
        axios.delete(`/deleteKubeconfig/${rowDeleteID}`)
            .then(response => {
                if (response.status === 200) {
                    handleCloseShowDelete();
                    getKubeconfigs();
                } else {
                    errorHandler.addToast('Failed to delete kubeconfig', 'danger');
                }
            })
            .catch(error => {
                errorHandler.addToast('Failed to delete kubeconfig: ' + error, 'danger');
            });
    }

    const getKubeconfigs = useCallback(() => GetApiRequest('/getKubeconfigs', 'kubeconfigs', data => {
        setKubeconfigsList(data);
        setKubeconfigsListLoading(false);
        if (data?.length > 0) {
            setKubeconfigsListShowClose(true);
        } else {
            setKubeconfigsListShowClose(false);
        }
    }, error => {
        errorHandler.addToast(error, 'danger');
    }), [errorHandler])

    useEffect(() => {
        if (showManageKubeconfigs) {
            getKubeconfigs();
        }
    }, [getKubeconfigs, showManageKubeconfigs]);

    const addNewKubeconfig = () => {
        if (kubeconfigName === "" || (!kubeconfigType && kubeconfig === null) || (kubeconfigType && kubeconfigText === "")) {
            return
        }
        let formData = new FormData();
        formData.append('name', kubeconfigName);
        let kubeconfigAddURL = "/addKubeconfig";
        let kubeconfigData;
        if (kubeconfigType) {
            kubeconfigAddURL = "/addKubeconfigText"
            kubeconfigData = kubeconfigText;
        } else {
            kubeconfigData = kubeconfig;
        }
        formData.append('kubeconfig', kubeconfigData);
        axios.post(kubeconfigAddURL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => {
            if (response.status === 200) {
                handleHideAddKubeconfig()
            } else {
                errorHandler.addToast('Failed to send Kubeconfig', 'danger')
            }
        }).catch(function (error) {
            if (error.response) {
                errorHandler.addToast('Failed to send Kubeconfig', 'danger')
            } else {
                errorHandler.addToast('Failed to send Kubeconfig', 'danger')
            }
        });
    }

    function KubeconfigsList() {
        const renderData = () => {
            if (kubeconfigsListLoading) {
                return (<div className={"text-center"}>
                        <Spinner animation="border" variant="info"/>
                    </div>)
            } else {
                return (<Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Config Name</th>
                            <th>Clusters</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {kubeconfigsList?.map((item, index) => (<tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.name}</td>
                                <td>
                                    {item.clusters?.map((i, idx) => (<ul key={idx}>
                                            <li>{i.name}</li>
                                            <li>{i.server}</li>
                                        </ul>))}
                                </td>
                                <td className={"text-center"}>
                                    <Button variant="danger" onClick={() => deleteRow(item.id)}>
                                        <Trash/>
                                    </Button>
                                </td>
                            </tr>))}
                        </tbody>
                    </Table>)
            }
        }
        return renderData()
    }

    return (<>
            <Modal show={showManageKubeconfigs} onHide={handleHideManageKubeconfigs} backdrop="static" keyboard={false}>
                <Modal.Header closeButton={kubeconfigsListShowClose}>
                    <Modal.Title>Manage Kubeconfigs</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <KubeconfigsList/>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleHideManageKubeconfigs}
                            hidden={!kubeconfigsListShowClose}>Close</Button>
                    <Button variant="success" onClick={handleShowAddKubeconfig}>Add Kubeconfig</Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showAddKubeconfig} onHide={handleHideAddKubeconfig} className="dark_modal">
                <Modal.Header closeButton>
                    <Modal.Title>Kubeconfig</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate>
                        <Form.Group controlId="kubeconfigName" className="mb-3">
                            <Form.Label>Kubeconfig name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Name of Kubeconfig"
                                value={kubeconfigName}
                                onChange={handleKubeconfigNameChange}
                                isInvalid={kubeconfigName === ''}
                                required/>
                        </Form.Group>
                        <Form.Group controlId="kubeconfigType" className="mb-3">
                            <Form.Check
                                type="switch"
                                id="kubeconfigTypeSwitch"
                                label={kubeconfigTypeName}
                                onChange={kubeconfigTypeChange}
                                checked={kubeconfigType}
                            />
                        </Form.Group>
                        <Form.Group controlId="kubeconfig" className="mb-3" hidden={!kubeconfigTypeFile}>
                            <Form.Label>Kubeconfig path</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleKubeconfigChange}
                                isInvalid={kubeconfig === null}
                                required/>
                        </Form.Group>
                        <Form.Group controlId="kubeconfigText" className="mb-3" hidden={!kubeconfigTypeText}>
                            <Form.Label>Kubeconfig text</Form.Label>
                            <Form.Control
                                as="textarea"
                                style={{ height: '300px' }}
                                onChange={handleKubeconfigTextChange}
                                isInvalid={kubeconfigText === null}
                                required/>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={addNewKubeconfig}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showDelete} onHide={handleCloseShowDelete}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this item?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseShowDelete}>
                        Close
                    </Button>
                    <Button variant="danger" autoFocus onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </>)
}

export default HomePageEditMode;