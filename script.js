//**  helper function for array shuffling  **/
//* Fisher - Yates shuffle *//
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

//* Helper function, returning boolean, depending if the passed divId is empty or includes the end field *//

function div(divId) {
  // used in a makeList function to determine if neighbor field can be considered empty
  const div = document.getElementById(`${divId}`);
  return div.innerHTML === '' || div.querySelector('.red') !== null;
}

//* Temporary storage object  *//
const tempObject = {
  currentBall: '',
  parseClassName(str) {
    if (str === '') return null;
    const ball = str.split(' ')[0];
    return ball === 'green' ? this.greenBall : this.redBall;
  },
};
//* Nicely named function for generating random empty fields, for initial start/end placement *//

function generateInitialRandomStartEndPositions(arr) {
  const shuffled = shuffle(arr);
  const start = shuffled[0];
  const end = shuffled[shuffled.length - 1];
  return [Number(start), Number(end)];
}
//* Elements selection *//

const container = document.querySelector('.container');
const button = document.querySelector('.generate-path');
const resetButton = document.querySelector('.reset-board');
const infoButton = document.querySelector('.info');
const body = document.querySelector('body');

//* Create board *//

function createBoard(length) {
  // board creation
  let markup = '';
  for (let i = 0; i < Math.pow(length, 2); i++) {
    markup += `<div class="field" data-fieldId="${i}" id="${i}"></div>`;
  }
  // attach board to parent element('container')
  container.insertAdjacentHTML('beforeend', markup.trim());
  // Creating and randomly placing start/end fields
  // get all board fields
  const allFields = Array.from(document.querySelectorAll('.field')).map(
    field => field.id
  );
  // pick two random positions from the board
  const positions = generateInitialRandomStartEndPositions(allFields);
  // create start ball, pass it to temp object, attach it to first random position
  const start = document.createElement('div');
  start.classList.add('green', 'ball');
  start.setAttribute('draggable', true);
  tempObject.greenBall = start;
  document.getElementById(`${positions[0]}`).appendChild(start);
  // create end ball, pass it to temp object, attach it to second random position
  const end = document.createElement('div');
  end.setAttribute('draggable', true);
  end.classList.add('red', 'ball');
  tempObject.redBall = end;
  document.getElementById(`${positions[1]}`).appendChild(end);
}

createBoard(10);

//* makeList function creates an adjacency list of all fields on the board*//

function makeList() {
  const list = {};
  const gameFields = Array.from(document.querySelectorAll('.field'));
  gameFields.forEach(field => {
    // traversing every field, check his neighbor fields, if they are empty, add them to adj. list
    const id = Number(field.getAttribute('id'));
    // logic for determining are neighbors empty
    const up = id < 10 || id - 10 < 0 || !div(id - 10) ? false : id - 10;
    const down = id >= 90 || id + 10 > 99 || !div(id + 10) ? false : id + 10;
    const left = id % 10 === 0 || id - 1 < 0 || !div(id - 1) ? false : id - 1;
    const right = id % 10 === 9 || id + 1 > 99 || !div(id + 1) ? false : id + 1;
    // filter for only empty fields, occupied fields will show as false in the values array
    const values = [up, down, left, right].filter(el => el !== false);
    // create new entry in the list object for every field. example: 11 : [1, 21, 10, 12] . field is 11 and his neighbor fields are those in the arr
    list[id] = values;
  });
  // return complete list
  return list;
}

//**  function isPath is main BFS function for traversing the adjacency list  **//

const isPath = function (start, end) {
  // all parents of the adj.list are stored in parentArray, from here shortest path is retraced
  const parentArray = [];
  // adjacency list
  const adjacencyList = makeList();
  // BFS queue
  const queue = [start];
  // visited set stores visited fields, preventing infinite looping
  const visited = new Set();
  // BFS algorithm
  while (queue.length > 0) {
    const current = queue.shift();
    // for every current field, an object is created with current as a parent, and an empty array for its neighbors. Array is filled later in the code with current neighbors
    parentArray.push({ parent: current, neighbors: [] });
    // adding visited class to every current field
    document.getElementById(current).classList.add('visited-field');
    // go to next iteration if current has already been visited
    if (visited.has(current)) continue;
    // else, add current to visited set and continue algo
    visited.add(current);
    // if match is found, current === to end field
    if (current === end) {
      // call retrace fn
      // retrace function is called with parentArray as an argument
      // function retrace gets the shortest path if path is possible and the traversal is finished
      const retrace = arr => {
        // we start with the end field
        const shortestPath = [end];
        // and loop backwards until we reach start field
        while (!shortestPath.includes(start)) {
          // we pick last element in the arr, call it previous
          const previous = shortestPath[shortestPath.length - 1];
          // loop trough his neighbors(children)
          for (let i = 0; i < arr.length; i++) {
            if (
              arr[i].neighbors.includes(previous) &&
              arr[i].parent !== previous
            ) {
              // and push previous parent in shortest path if above conditions are met
              shortestPath.push(arr[i].parent);
              break;
            }
          }
        }
        // return shortest path
        return shortestPath;
      };
      // variable path now holds shortest path fields ids
      const path = retrace(parentArray);
      // drawing shortest path
      setTimeout(() => {
        drawShortestPath(path);
      }, 500);

      return true;
    }
    // continuation of BFS algo, if match is not found...we pass its neighbors to the queue and parentArray
    for (let neighbor of adjacencyList[current]) {
      parentArray[parentArray.length - 1].neighbors.push(neighbor);
      queue.push(neighbor);
    }
  }
  // if path creation is impossible, alert will trigger
  alert('It is not possible to create a path');
  return false;
};

//** Draw path  **/
function drawShortestPath(arr) {
  // reverse arr, so the start of the shortest path drawing begins from green field(start). retrace function returns shortest path from the end, traces backward
  const reversed = arr.reverse();
  for (let i = 0; i < reversed.length; i++) {
    setTimeout(function colorFields() {
      document.getElementById(reversed[i]).classList.add('shortest-path');
    }, i * 100);
  }
}

//** Functions to create and remove obstacles on the board  **/

function makeWall(e) {
  // create wall element
  const wall = document.createElement('div');
  wall.classList.add('wall');
  // gard clause, if dblclick happen anywhere out of field class
  if (!e.target.classList.contains('field')) return;
  // gard clause to prevent making of double wall elements in same field
  if (e.target.classList.contains('field') && e.target.innerHTML !== '') return;
  // if field is empty, dblclick will create the wall element
  if (e.target.classList.contains('field')) e.target.append(wall);
}

function removeWall(e) {
  if (!e.target.classList.contains('wall')) return;

  const parent = e.target.closest('.field');

  const child = parent.firstChild;

  parent.removeChild(child);
}
//*** Event listeners and drag/drop functionality  ***/

//** call isPath function with ids of the start ball and end ball fields   **/
button.addEventListener('click', () => {
  const startFieldId = Number(
    document.querySelector('.green').closest('.field').id
  );
  const endFieldId = Number(
    document.querySelector('.red').closest('.field').id
  );

  isPath(startFieldId, endFieldId);
});

//** Make walls, event delegation  **/
container.addEventListener('dblclick', e => {
  makeWall(e);
});

//** Remove walls, event delegation   **/
container.addEventListener('dblclick', e => {
  removeWall(e);
});
//** Restart board **/
resetButton.addEventListener('click', () => {
  location.reload();
});
//** Drag/drop functions and listeners  **/
const startEndFields = document.querySelectorAll('.ball');
const allEmptyFields = Array.from(document.querySelectorAll('.field')).filter(
  field => field.innerHTML === ''
);

function dragStart() {
  const getClass = this.getAttribute('class');
  tempObject.currentBall = getClass;
  this.classList.add('hold');

  setTimeout(() => (this.className = 'invisible'), 100);
}

startEndFields.forEach(field => {
  field.addEventListener('dragstart', dragStart);
  field.addEventListener('dragend', dragEnd);
});
function dragEnd() {
  const currentClassName = tempObject.currentBall;
  this.className = currentClassName;
}

function dragOver(e) {
  e.preventDefault();
}
function dragEnter(e) {
  e.preventDefault();
  this.classList.add('hovered');
}
function dragLeave(e) {
  e.preventDefault();
  this.classList.remove('hovered');
}
function dragDrop(e) {
  if (e.target.innerHTML === '') {
    this.append(tempObject.parseClassName(tempObject.currentBall));
    this.classList.remove('hovered');
  }
}

for (let field of allEmptyFields) {
  field.addEventListener('dragover', dragOver);
  field.addEventListener('dragenter', dragEnter);
  field.addEventListener('dragleave', dragLeave);
  field.addEventListener('drop', dragDrop);
}
