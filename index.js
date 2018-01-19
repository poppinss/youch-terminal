'use strict'

/**
 * youch-terminal
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chalk = require('chalk')

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
    return !frame.isNative && (!mainFrame || frame.file !== mainFrame.file || frame.line !== mainFrame.line)
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
  return frame.method || 'anonymous'
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
  const content = isMain ? chalk.bgRed.white(line) : line
  return `${chalk.dim(counter)}${space}${content}`
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
  return [`${chalk.red(error.name)}: ${chalk.yellow(error.message)}\n`]
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
  return [`${chalk.dim('at')} ${chalk.green(frame.filePath)}${chalk.green(`(${frameMethod(frame)})`)}:${frame.line}`]
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
  return frames.map((frame, index) => {
    return [
      '',
      `${chalk.dim(index+1)} ${chalk.yellow(frameMethod(frame))}`,
      `  ${chalk.green(frame.filePath)}${':' + frame.line}`
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
    .concat(getMainFrameLocation(firstFrame))
    .concat(getCodeLines(firstFrame))
    .concat(getFramesInfo(filterNativeFrames(error.frames, firstFrame)))
    .concat([''])
    .join('\n')
}
