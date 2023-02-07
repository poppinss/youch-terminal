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
const wordwrap = require('wordwrap')
const stringWidth = require('string-width')
const { dim, yellow, green, red, cyan } = require('kleur')

const TERMINAL_SIZE = process.stdout.columns
const POINTER = platform === 'win32' && !process.env.WT_SESSION ? '>' : '❯'
const DASH = platform === 'win32' && !process.env.WT_SESSION ? '⁃' : '⁃'

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
 * Returns the error message
 */
function getMessage(error, prefix, hideErrorTitle) {
  let message

  const wrapper = wordwrap(stringWidth(prefix) + 2, TERMINAL_SIZE)

  if (!hideErrorTitle) {
    message = `${prefix}  ${red(wrapper(`${error.name}: ${error.message}`).trim())}`
  } else {
    message = `${prefix}  ${red(wrapper(`${error.message}`).trim())}`
  }

  return [message, prefix]
}

/**
 * Returns the error help text
 */
function getHelpText(error, prefix) {
  const help = error.help
  if (!help) {
    return []
  }

  const wrapper = wordwrap(stringWidth(prefix) + 4, TERMINAL_SIZE)

  if (Array.isArray(help)) {
    return help.map((line) => {
      return `${prefix}  ${cyan(wrapper(`- ${line}`).trim())}`
    }).concat([prefix])
  }

  return [`${prefix}  ${cyan(help)}`, prefix]
}

/**
 * Get the relative path for a given file path, from the current working directory
 *
 * @param  {String} filePath
 *
 * @return {String}
 */
function getShortPath(filePath) {
  const posixCwd = cwd().replace(/\\/g, '/')
  return filePath.replace(`${posixCwd}/`, '')
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
  return [`${prefix}  at ${yellow(`${frameMethod(frame)}`)} ${green(filePath)}:${green(frame.line)}`]
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
  const padding = whiteSpace(String(totalFrames.length), '')

  return frames.map((frame) => {
    const filePath = displayShortPath
      ? frame.filePath.replace(`${cwd()}${sep}`, '')
      : frame.filePath

    return [
      `${prefix}${padding}${yellow(`${DASH} ${frameMethod(frame)}`)}`,
      `${prefix}${padding}  ${green(filePath)}${':' + green(frame.line)}`
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
 * @param {Number} options.framesMaxLimit
 * @param {Boolean} options.displayShortPath
 * @param {Boolean} options.hideErrorTitle
 * @param {Boolean} options.hideMessage
 * @param {Boolean} options.displayMainFrameOnly
 *
 * @return {String}
 */
module.exports = ({ error }, options) => {
  const firstFrame = mainFrame(error.frames)
  options = { prefix: ' ', framesMaxLimit: 3, ...options }

  const otherFrames = options.displayMainFrameOnly && firstFrame
  ? []
  : getFramesInfo(
      filterNativeFrames(error.frames, firstFrame),
      options.prefix,
      options.displayShortPath
    )

  return ['']
    .concat(options.hideMessage ? [] : getMessage(error, options.prefix, options.hideErrorTitle))
    .concat(getHelpText(error, options.prefix))
    .concat(getMainFrameLocation(firstFrame, options.prefix, options.displayShortPath))
    .concat(getCodeLines(firstFrame, options.prefix))
    .concat(otherFrames.length ? [''] : [])
    .concat(
      Number.isFinite(options.framesMaxLimit)
        ? otherFrames.slice(0, options.framesMaxLimit)
        : otherFrames
    )
    .concat([''])
    .join('\n')
}
