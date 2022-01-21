import React, { useContext } from 'react'
// import { CountContext } from '../App'

// function ComponentF() {
//   const countContext = useContext(CountContext) 
//   return (
//     <div>
//       Component F - {countContext.countState}
//       <button onClick={() => countContext.countDispatch('increment')}>Increment</button>
//       <button onClick={() => countContext.countDispatch('decrement')}>Decrement</button>
//       <button onClick={() => countContext.countDispatch('reset')}>Reset</button>
//     </div>
//   )
// }

// export default ComponentF

// Below is the code for the useContext tutorial 
// import {UserContext, ChannelContext} from '../App'
// function ComponentF() {
//   return (
//     <div>
//       <UserContext.Consumer>
//         {
//           user => {
//             return (
//               <ChannelContext.Consumer>
//                 {
//                   channel => {
//                     return (
//                       <div>User Context Value is {user} and Channel Context Value is {channel}</div>
//                     )
//                   }
//                 }
//               </ChannelContext.Consumer>
//             )
//           }
//         }
//       </UserContext.Consumer>
//     </div>
//   )
// }
// export default ComponentF
