'use strict'

/**
 * youch-terminal
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { platform, cwd } = process
const { sep } = require('path')
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
  let whiteSpace = ''
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
function codeLine (line, counter, maxCounter, isMain, prefix) {
  const space = whiteSpace(String(maxCounter), String(counter))
  if (isMain) {
    return `${prefix}${red(POINTER)}${space}${red(counter)}${red('|')}${space} ${red(line)}`
  }
  return `${prefix} ${space}${dim(counter)}${dim('|')}${space} ${line}`
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
function getTitle (error, prefix) {
  return [`${prefix} ${bgRed(white(` ${error.code ? error.code : ''}${error.name} `))}`, prefix]
}

/**
 * Returns the error message
 */
function getMessage(error, prefix) {
  return [`${prefix} ${error.message}`, prefix]
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
function getMainFrameLocation (frame, prefix, displayShortPath) {
  if (!frame) {
    return []
  }

  const filePath = displayShortPath ? frame.filePath.replace(`${cwd()}${sep}`, '') : frame.filePath
  return [`${prefix} at ${yellow(`${frameMethod(frame)}`)} ${green(filePath)}:${green(frame.line)}`]
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
function getCodeLines (frame, prefix) {
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
    return codeLine(line, counter, maxCounter, false, prefix)
  }))
  .concat([frame.context.line].map((line) => {
    counter++
    return codeLine(line, counter, maxCounter, true, prefix)
  }))
  .concat(post.map((line) => {
    counter++
    return codeLine(line, counter, maxCounter, false, prefix)
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
function getFramesInfo (frames, prefix, displayShortPath) {
  const totalFrames = String(frames.length)
  return frames.map((frame, index) => {
    const frameNumber = String(index + 1)
    const padding = frameNumber.padStart(totalFrames.length - frameNumber.length, '0')
    const filePath = displayShortPath ? frame.filePath.replace(`${cwd()}${sep}`, '') : frame.filePath

    return [
      prefix,
      `${prefix}   ${dim(padding)}  ${yellow(frameMethod(frame))}`,
      `${prefix}${whiteSpace(padding, '')}   ${green(filePath)}${':' + green(frame.line)}`
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
 * @param  {Object} json.error
 * @param {String} options.prefix
 * @param {Boolean} options.displayShortPath
 * @param {Boolean} options.hideErrorTitle
 * @param {Boolean} options.hideMessage
 * @param {Boolean} options.displayMainFrameOnly
 *
 * @return {String}
 */
module.exports = ({ error }, options) => {
  const firstFrame = mainFrame(error.frames)
  options = { prefix: '', ...options }

  return ['']
    .concat(options.hideErrorTitle ? [] : getTitle(error, options.prefix))
    .concat(options.hideMessage ? [] : getMessage(error, options.prefix))
    .concat(getMainFrameLocation(firstFrame, options.prefix, options.displayShortPath))
    .concat(getCodeLines(firstFrame, options.prefix))
    .concat(
      options.displayMainFrameOnly
        ? []
        : getFramesInfo(
            filterNativeFrames(error.frames, firstFrame),
            options.prefix,
            options.displayShortPath
          )
    )
    .concat([''])
    .join('\n')
}
