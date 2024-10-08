import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import client from "../../../services/restClient";
import _ from "lodash";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import moment from "moment";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

const getSchemaValidationErrorsStrings = (errorObj) => {
  let errMsg = {};
  for (const key in errorObj.errors) {
    if (Object.hasOwnProperty.call(errorObj.errors, key)) {
      const element = errorObj.errors[key];
      if (element?.message) {
        errMsg.push(element.message);
      }
    }
  }
  return errMsg.length ? errMsg : errorObj.message ? errorObj.message : null;
};

const DepartmentHOSCreateDialogComponent = (props) => {
  const [_entity, set_entity] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const urlParams = useParams();
  const [sectionId, setSectionId] = useState([]);
  const [employeeId, setEmployeeId] = useState([]);

  useEffect(() => {
    set_entity(props.entity);
  }, [props.entity, props.show]);

  useEffect(() => {
    //on mount sections
    client
      .service("sections")
      .find({
        query: {
          $limit: 10000,
          $sort: { createdAt: -1 },
          _id: urlParams.singleSectionsId,
        },
      })
      .then((res) => {
        setSectionId(
          res.data.map((e) => {
            return { name: e["name"], value: e._id };
          }),
        );
      })
      .catch((error) => {
        console.log({ error });
        props.alert({
          title: "Sections",
          type: "error",
          message: error.message || "Failed get sections",
        });
      });
  }, []);
  useEffect(() => {
    //on mount employees
    client
      .service("employees")
      .find({
        query: {
          $limit: 10000,
          $sort: { createdAt: -1 },
          _id: urlParams.singleEmployeesId,
        },
      })
      .then((res) => {
        setEmployeeId(
          res.data.map((e) => {
            return { name: e["name"], value: e._id };
          }),
        );
      })
      .catch((error) => {
        console.log({ error });
        props.alert({
          title: "Employees",
          type: "error",
          message: error.message || "Failed get employees",
        });
      });
  }, []);

  const onSave = async () => {
    let _data = {
      sectionId: _entity?.sectionId?._id,
      employeeId: _entity?.employeeId?._id,
    };

    setLoading(true);
    try {
      await client.service("departmentHOS").patch(_entity._id, _data);
      const eagerResult = await client.service("departmentHOS").find({
        query: {
          $limit: 10000,
          _id: { $in: [_entity._id] },
          $populate: [
            {
              path: "sectionId",
              service: "sections",
              select: ["name"],
            },
            {
              path: "employeeId",
              service: "employees",
              select: ["name"],
            },
          ],
        },
      });
      props.onHide();
      props.alert({
        type: "success",
        title: "Edit info",
        message: "Info departmentHOS updated successfully",
      });
      props.onEditResult(eagerResult.data[0]);
    } catch (error) {
      console.log("error", error);
      setError(
        getSchemaValidationErrorsStrings(error) || "Failed to update info",
      );
      props.alert({
        type: "error",
        title: "Edit info",
        message: "Failed to update info",
      });
    }
    setLoading(false);
  };

  const renderFooter = () => (
    <div className="flex justify-content-end">
      <Button
        label="save"
        className="p-button-text no-focus-effect"
        onClick={onSave}
        loading={loading}
      />
      <Button
        label="close"
        className="p-button-text no-focus-effect p-button-secondary"
        onClick={props.onHide}
      />
    </div>
  );

  const setValByKey = (key, val) => {
    let new_entity = { ..._entity, [key]: val };
    set_entity(new_entity);
    setError({});
  };

  const sectionIdOptions = sectionId.map((elem) => ({
    name: elem.name,
    value: elem.value,
  }));
  const employeeIdOptions = employeeId.map((elem) => ({
    name: elem.name,
    value: elem.value,
  }));

  return (
    <Dialog
      header="Edit DepartmentHOS"
      visible={props.show}
      closable={false}
      onHide={props.onHide}
      modal
      style={{ width: "40vw" }}
      className="min-w-max"
      footer={renderFooter()}
      resizable={false}
    >
      <div
        className="grid p-fluid overflow-y-auto"
        style={{ maxWidth: "55vw" }}
        role="departmentHOS-edit-dialog-component"
      >
        <div className="col-12 md:col-6 field mt-5">
          <span className="align-items-center">
            <label htmlFor="sectionId">SectionId:</label>
            <Dropdown
              id="sectionId"
              value={_entity?.sectionId?._id}
              optionLabel="name"
              optionValue="value"
              options={sectionIdOptions}
              onChange={(e) => setValByKey("sectionId", { _id: e.value })}
            />
          </span>
        </div>
        <div className="col-12 md:col-6 field mt-5">
          <span className="align-items-center">
            <label htmlFor="employeeId">EmployeeId:</label>
            <Dropdown
              id="employeeId"
              value={_entity?.employeeId?._id}
              optionLabel="name"
              optionValue="value"
              options={employeeIdOptions}
              onChange={(e) => setValByKey("employeeId", { _id: e.value })}
            />
          </span>
        </div>
        <div className="col-12">&nbsp;</div>
        
        <small className="p-error">
          {Array.isArray(Object.keys(error))
            ? Object.keys(error).map((e, i) => (
                <p className="m-0" key={i}>
                  {e}: {error[e]}
                </p>
              ))
            : error}
        </small>
      </div>
    </Dialog>
  );
};

const mapState = (state) => {
  const { user } = state.auth;
  return { user };
};
const mapDispatch = (dispatch) => ({
  alert: (data) => dispatch.toast.alert(data),
});

export default connect(
  mapState,
  mapDispatch,
)(DepartmentHOSCreateDialogComponent);
