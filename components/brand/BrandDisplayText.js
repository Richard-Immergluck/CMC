const isWhitespace = character => /\s/.test(character)

const getFirstDisplayCharacterIndex = text => {
  return [...text].findIndex(character => !isWhitespace(character))
}

const renderCharacter = ({ character, firstDisplayCharacterIndex, index }) => {
  const key = `${character}-${index}`

  if (index === firstDisplayCharacterIndex) {
    return (
      <span className='cmc-home-hero-initial' key={key}>
        {character}
      </span>
    )
  }

  if (character === '.') {
    return (
      <span className='cmc-home-hero-dot' key={key}>
        {character}
      </span>
    )
  }

  if (character === 'i') {
    return (
      <span aria-label='i' className='cmc-home-hero-dotted-i' key={key} role='img'>
        <span className='cmc-home-hero-dotted-i__stem' aria-hidden='true'>ı</span>
        <span className='cmc-home-hero-dotted-i__dot' aria-hidden='true' />
      </span>
    )
  }

  return character
}

const BrandDisplayText = ({ text }) => {
  const tokens = text.match(/(\n|\s+|[^\s]+)/g) ?? []
  const firstDisplayCharacterIndex = getFirstDisplayCharacterIndex(text)

  const visualText = tokens.map((token, tokenIndex) => {
    const tokenCharacters = [...token]
    const tokenStartIndex = tokens.slice(0, tokenIndex).join('').length

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
          firstDisplayCharacterIndex,
          index: tokenStartIndex + index
        }))}
      </span>
    )
  })

  return (
    <>
      <span className='cmc-sr-only'>{text.replace(/\s+/g, ' ')}</span>
      <span aria-hidden='true' className='cmc-brand-display-visual'>
        {visualText}
      </span>
    </>
  )
}

export default BrandDisplayText
