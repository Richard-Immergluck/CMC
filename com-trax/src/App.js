import "./App.css";
import React, { useReducer } from "react";
import PostList from "./components/PostList.js";
import PostForm from "./components/PostForm";
import ClassClickCounter from "./components/ClassClickCounter";
import HookCounter from "./components/HookCounter";
import HookCounter2 from "./components/HookCounter2";
import HookCounterThree from "./components/HookCounterThree";
import HookCounterFour from "./components/HookCounterFour";
import ClassCounterOne from "./components/ClassCounterOne";
import HookCounterOneUseEffect from "./components/HookCounterOneUseEffect";
import ClassMouse from "./components/ClassMouse";
import HookMouse from "./components/HookMouse";
import MouseContainer from "./components/MouseContainer";
import IntervalClassCounter from "./components/IntervalClassCounter";
import IntervalHookCounter from "./components/IntervalHookCounter";
import DataFetching from "./components/DataFetching";
import Counter1 from "./components/Counter1";
import Counter2 from "./components/Counter2";
import Counter3 from "./components/Counter3";
import ComponentA from "./components/ComponentA";
import ComponentB from "./components/ComponentB";
import ComponentC from "./components/ComponentC";
import DataFetchingOne from "./components/DataFetchingOne";
import DataFetchingTwo from "./components/DataFetchingTwo";

// export const UserContext = React.createContext();
// export const ChannelContext = React.createContext();

// export const CountContext = React.createContext();

// const initialState = 0;
// const reducer = (state, action) => {
//   switch (action) {
//     case "increment":
//       return state + 1;
//     case "decrement":
//       return state - 1;
//     case "reset":
//       return initialState;
//     default:
//       return state;
//   }
// };

function App() {
  // const [count, dispatch] = useReducer(reducer, initialState);
  return (
    <div className="App">
      <h1>Website Title Goes here</h1>
      {/* <PostForm /> */}
      {/* <PostList /> */}
      {/* <ClassClickCounter /> */}
      {/* <HookCounter /> */}
      {/* <HookCounter2 /> */}
      {/* <HookCounterThree /> */}
      {/* <HookCounterFour /> */}
      {/* <ClassCounterOne /> */}
      {/* <HookCounterOneUseEffect /> */}
      {/* <ClassMouse /> */}
      {/* <HookMouse /> */}
      {/* <MouseContainer /> */}
      {/* <IntervalClassCounter /> */}
      {/* <IntervalHookCounter /> */}
      {/* <DataFetching/> */}
      {/* <UserContext.Provider value={"Richard"}>
        <ChannelContext.Provider value={"CBC or Com-Trax"}>
          <ComponentC />
        </ChannelContext.Provider>
      </UserContext.Provider> */}
      {/* <Counter1 /> */}
      {/* <Counter3 /> */}
      {/* <CountContext.Provider value={{countState: count, countDispatch: dispatch}}>
        Count = {count}
        <ComponentA />
        <ComponentB />
        <ComponentC />
      </CountContext.Provider> */}
      {/* <DataFetchingOne /> */}
      <DataFetchingTwo />
    </div>
  );
}

export default App;
