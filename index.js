'use strict'

/**
 * youch-terminal
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { platform } = process
const { bgRed, dim, yellow, green, white, red } = require('kleur')

const POINTER = platform === 'win32' && !process.env.WT_SESSION ? '>' : '❯'

/**
 * Pulls the main frame from the frames stack
 *
 * @method mainFrame
 *
 * @param  {Array}  frames
 *
 * @return {Object|Null}
 */
function mainFrame (frames) {
  return frames.find((frame) => frame.isApp) || null
}

/**
 * Filter only relevant frames that are supposed to
 * be printed on the screen
 *
 * @method filterNativeFrames
 *
 * @param  {Array}           frames
 * @param  {Object}          mainFrame
 *
 * @return {void}
 */
function filterNativeFrames (frames, mainFrame) {
  return frames.filter((frame) => {
    return (frame.isApp || frame.isModule) && (!mainFrame || frame.file !== mainFrame.file || frame.line !== mainFrame.line)
  })
}

/**
 * Returns the method name for a given frame
 *
 * @method frameMethod
 *
 * @param  {Object}    frame
 *
 * @return {String}
 */
function frameMethod (frame) {
  return frame.callee || 'anonymous'
}

/**
 * Returns the white space for a given char based
 * upon the biggest char.
 *
 * This is done to keep rows symmetrical.
 *
 * @method whiteSpace
 *
 * @param  {String}   biggestChar
 * @param  {String}   currentChar
 *
 * @return {String}
 */
function whiteSpace (biggestChar, currentChar) {
  let whiteSpace = ' '
  const whiteSpaceLength = biggestChar.length - currentChar.length

  for (let i = 0; i <= whiteSpaceLength; i++) {
    whiteSpace += ' '
  }

  return whiteSpace
}

/**
 * Returns the line of code with the line number
 *
 * @method codeLine
 *
 * @param  {String}  line
 * @param  {Number}  counter
 * @param  {Number}  maxCounter
 * @param  {Boolean} isMain
 *
 * @return {String}
 */
function codeLine (line, counter, maxCounter, isMain) {
  const space = whiteSpace(String(maxCounter), String(counter))
  if (isMain) {
    return ` ${red(POINTER)} ${red(counter)}${red('|')}${space}${red(line)}`
  }
  return `   ${dim(counter)}${dim('|')}${space}${line}`
}

/**
 * Returns the main error title
 *
 * @method getTitle
 *
 * @param  {Object} error
 *
 * @return {Array}
 */
function getTitle (error) {
  return [bgRed(white(` ${error.code ? error.code : ''}${error.name} \n`))]
}

/**
 * Returns the error message
 */
function getMessage(error) {
  return [` ${error.message} \n`]
}

/**
 * Returns the main frame location with line number
 *
 * @method getMainFrameLocation
 *
 * @param  {Object}             frame
 *
 * @return {Array}
 */
function getMainFrameLocation (frame) {
  if (!frame) {
    return []
  }
  return [` at ${yellow(`${frameMethod(frame)}`)} ${green(frame.filePath)}:${green(frame.line)}`]
}

/**
 * Returns the main frame code lines
 *
 * @method getCodeLines
 *
 * @param  {Object}     frame
 *
 * @return {Array}
 */
function getCodeLines (frame) {
  if (!frame || !frame.context || !frame.context.line) {
    return []
  }

  let counter = frame.context.start - 1

  const pre = frame.context.pre.split('\n')
  const post = frame.context.post.split('\n')
  const maxCounter = counter + (pre.length + post.length + 1)

  return []
  .concat(pre.map((line) => {
    counter++
    return codeLine(line, counter, maxCounter)
  }))
  .concat([frame.context.line].map((line) => {
    counter++
    return codeLine(line, counter, maxCounter, true)
  }))
  .concat(post.map((line) => {
    counter++
    return codeLine(line, counter, maxCounter)
  }))
}

/**
 * Returns info for all other secondary frames
 *
 * @method getFramesInfo
 *
 * @param  {Array}      frames
 *
 * @return {Array}
 */
function getFramesInfo (frames) {
  const totalFrames = String(frames.length)
  return frames.map((frame, index) => {
    const frameNumber = String(index + 1)
    const padding = frameNumber.padStart(totalFrames.length - frameNumber.length, '0')
    return [
      '',
      `   ${dim(padding)}  ${yellow(frameMethod(frame))}`,
      `${whiteSpace(padding, '')}   ${green(frame.filePath)}${':' + green(frame.line)}`
    ].join('\n')
  })
}

/**
 * Returns a multi-line string all ready to be printed
 * on console.
 *
 * Everything will break if error is not the output of
 * youch.toJSON()
 *
 * @method
 *
 * @param  {Object} options.error
 *
 * @return {String}
 */
module.exports = ({ error }) => {
  const firstFrame = mainFrame(error.frames)

  return ['']
    .concat(getTitle(error))
    .concat(getMessage(error))
    .concat(getMainFrameLocation(firstFrame))
    .concat(getCodeLines(firstFrame))
    .concat(getFramesInfo(filterNativeFrames(error.frames, firstFrame)))
    .concat([''])
    .join('\n')
}
