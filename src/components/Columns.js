import React from "react";

function Columns() {
  const items = ["Test1", "Test2"];
  return (
    // <>
    //   {items.map((item) => (
    //     <React.Fragment key={item.id}>
    //       <h1>Title</h1>
    //       <p>{item.title}</p>
    //     </React.Fragment>
    //   ))}
    // </>

    <>
      <td>Name</td>
      <td>Richard</td>
    </>
  );
}

export default Columns;
