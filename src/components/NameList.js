import React from "react";
import Person from "./Person";

function NameList() {
  // const names = ["Bruce", "Clark", "Diana", "Bruce"];
  // const nameList = names.map((name, index) => <h2 key={index}> {index} - {name} </h2>);
  // return <div>{nameList}</div>;
  const persons = [
    {
      id: 1,
      name: "Clark",
      age: 30,
      job: "Reporter",
    },
    {
      id: 2,
      name: "Bruce",
      age: 32,
      job: "Millionaire",
    },
    {
      id: 3,
      name: "Diana",
      age: 28,
      job: "Lay-about",
    },
    {
      id: 4,
      name: "Peter",
      age: 17,
      job: "Photo-journalist",
    },
  ];
  const personList = persons.map((person) => (
    <Person key={person.id} id={person.id} person={person}></Person>
  ));
  return <div>{personList}</div>;
}

export default NameList;
