import React, { Component } from "react";

class EventBind extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: 'Hello',
    };
    // this.clickHandler = this.clickHandler.bind(this) - 3. Binding the event handler in the constructor
  }

//   clickHandler() {
//       this.setState({
//           message: 'Goodbye'
//       })
//     console.log(this);
//   }

clickHandler = () => {
    this.setState({
        message: 'Goodbye'
    })
}

  render() {
    return (
      <div>
        <div>{this.state.message}</div>
        {/* <button onClick={this.clickHandler.bind(this)}>Click</button> - 1. Using the bind keyword. */}
        {/* <button onClick={() => this.clickHandler()}>Click</button> 2. Using an arrow function */}
        {/* <button onClick={this.clickHandler}>Click</button> 3. render method if the event handler is bound in the constructor */}
        <button onClick={this.clickHandler}>Click</button>
      </div>
    );
  }
}

export default EventBind;
