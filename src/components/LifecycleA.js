import React, { Component } from "react";
import LifecycleB from "./LifecycleB";

class LifecycleA extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "Richard",
    };
    console.log("LifecycleA constructor");
  }

  static getDerivedStateFromProps(props, state) {
    console.log("LifecycleA getDerivedStateFromProps");
    return null;
  }

  componentDidMount() {
    console.log("LifecycleA didmount");
  }

  shouldComponentUpdate() {
    console.log("LifecycleA shouldComponentUpdate");
    return true
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    console.log("LivecycleA getSnapshotBeforeUpdate");
    return null
  }

  componentDidUpdate() {
    console.log("LifecycleA componentDidUpdate");
  }

  changestate = () => {
    this.setState({
      name: "Immergluck"
    })
  }

  render() {
    console.log("LifecycleA render");
    return (
      <div>
        <div>Lifecycle A</div>
        <LifecycleB />
        <button onClick={this.changestate}>Change State</button>
      </div>
    );
  }
}

export default LifecycleA;
