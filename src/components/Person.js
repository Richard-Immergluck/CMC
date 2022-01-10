import React from 'react'

function Person({person, id}) {
  return (
    <div>
      <h1>{person.id}</h1>
      <h2>I am {person.name} and I am {person.age} years old. I am a {person.job}</h2>
    </div>
  )
}

export default Person
