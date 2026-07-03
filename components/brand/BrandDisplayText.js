const isWhitespace = character => /\s/.test(character)

const getFirstDisplayCharacterIndex = text => {
  return [...text].findIndex(character => !isWhitespace(character))
}

const getFinalDisplayCharacterIndex = text => {
  const characters = [...text]

  for (let index = characters.length - 1; index >= 0; index -= 1) {
    if (!isWhitespace(characters[index])) {
      return index
    }
  }

  return -1
}

const renderCharacter = ({ character, firstDisplayCharacterIndex, finalDisplayCharacterIndex, index }) => {
  const key = `${character}-${index}`

  if (index === firstDisplayCharacterIndex) {
    return (
      <span className='cmc-home-hero-initial' key={key}>
        {character}
      </span>
    )
  }

  if (index === finalDisplayCharacterIndex && character === '.') {
    return (
      <span className='cmc-home-hero-dot' key={key}>
        {character}
      </span>
    )
  }

  if (character === 'i') {
    return (
      <span className='cmc-home-hero-dotted-i' key={key}>
        {character}
        <span aria-hidden='true' />
      </span>
    )
  }

  return character
}

const BrandDisplayText = ({ text }) => {
  const tokens = text.match(/(\n|\s+|[^\s]+)/g) ?? []
  const firstDisplayCharacterIndex = getFirstDisplayCharacterIndex(text)
  const finalDisplayCharacterIndex = getFinalDisplayCharacterIndex(text)
  let characterIndex = 0

  return tokens.map((token, tokenIndex) => {
    const tokenCharacters = [...token]
    const tokenStartIndex = characterIndex

    characterIndex += tokenCharacters.length

    if (token === '\n') {
      return <br key={`line-break-${tokenIndex}`} />
    }

    if (tokenCharacters.every(isWhitespace)) {
      return token
    }

    return (
      <span className='cmc-brand-display-word' key={`${token}-${tokenIndex}`}>
        {tokenCharacters.map((character, index) => renderCharacter({
          character,
          finalDisplayCharacterIndex,
          firstDisplayCharacterIndex,
          index: tokenStartIndex + index
        }))}
      </span>
    )
  })
}

export default BrandDisplayText
