import React, { Component } from "react";

class UserGreeting extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: true,
    };
  }

  render() {

    // Example 4 - Short Circuit Operator
    return (
        this.state.isLoggedIn && <div>Welcome Richard</div>
    )
    // end - Example 4

    // Example 3 - Ternary Conditional Operator
    // return this.state.isLoggedin ? (
    //   <div>Welcome Richard</div>
    // ) : (
    //   <div>Welcome Guest</div>
    // );
    // end - Example 3

    // Example 2 - Element Variables
    // let message;
    // if (this.state.isLoggedIn) {
    //   message = <div>Welcome Richard</div>;
    // } else {
    //   message = <div>Welcome Guest</div>;
    // }
    // return <div>{message}</div>
    // end - Example 2

    // Example 1 - if/else statement

    //   if (this.state.isLoggedIn) {
    //       return(
    //           <div>Welcome Richard</div>
    //       )
    //   } else {
    //       return (
    //           <div>Welcome Guest</div>
    //       )
    //   }
    // end - Example 1

    // Default Example with two statements
    // return (
    //   <div>
    //     <div>Welcome Richard</div>
    //     <div>Welcome Guest</div>
    //   </div>
    // );
    // end Default example
  }
}

export default UserGreeting;
