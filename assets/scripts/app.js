class ProjectData {
    constructor(title, desc, id, info, list) {
    this.title = title;
    this.desc = desc;
    this.id = id;
    this.info = info;
    this.list = list;
    }
}

class ElementAttribute {
    constructor(name, value) {
        this.name = name;
        this.value = value
    }
}

class Component {
    constructor(renderHookId) {
        this.hookId = renderHookId;
    }
    createRootElement(tag, cssClass, attributesArr) {
        const rootEl = document.createElement(tag);
        if (cssClass) {rootEl.className = cssClass}
        if (attributesArr && attributesArr.length > 0) {
            for (const attr of attributesArr) {
                rootEl.setAttribute(attr.name, attr.value)
            }
        }
        document.querySelector(this.hookId).append(rootEl);
        return rootEl
    }
}

class MoreInfoBlock extends Component {
    constructor(project) {
        super(`#${project.list}-list`);
        this.project = project;
        this.hostEl = document.getElementById(this.project.id);
        this.render()
    }

    calculatePosition(elem) {
        const hostElPosLeft = this.hostEl.offsetLeft;
        const hostElPosTop = this.hostEl.offsetTop;
        const hostElHeight = this.hostEl.clientHeight;
        const hostParentScroll = this.hostEl.parentElement.scrollTop;


        const x = hostElPosLeft + 20;
        const y = hostElPosTop + hostElHeight - hostParentScroll - 10;

        elem.style.position = 'absolute';
        elem.style.left = x + 'px';
        elem.style.top = y + 'px';
    }

    render() {
        const moreInfoElem = this.createRootElement('div', 'card', [new ElementAttribute('id', 'info-'+this.project.id)]);
        moreInfoElem.innerHTML = `
            <h3>${this.project.title}</h3>
            <p>${this.project.info}</p>
            `;
        moreInfoElem.addEventListener('click', moreInfoElem.remove);
        this.calculatePosition(moreInfoElem);
    }
}

class ProjectItem extends Component {
    constructor(project, currList, listToSwitch) {
        super(`#${currList.listName}-list`);
        this.project = project;
        this.listToSwitch = listToSwitch;
        this.currList = currList;
        this.render();
        this.connectDrag();
    }

    connectDrag() {
        document.getElementById(this.project.id).addEventListener('dragstart', event => {
            event.dataTransfer.setData('text/plain', this.project.id);
            event.dataTransfer.effectAllowed = 'move'
        })
    }

    showInfo() {
        if (!document.getElementById('info-'+this.project.id)) {
            new MoreInfoBlock(this.project)
        }
    }

    changeList() {
        this.project.list = this.listToSwitch.listName;
        this.listToSwitch.projects.push(this.project);
        this.currList.projects = this.currList.projects.filter(project => project !== this.project);
        App.refreshLists();
        document.getElementById(this.project.id).scrollIntoView({behavior: 'smooth'});
    }

    render() {
        const projElem = this.createRootElement('li', 'card',
            [
                new ElementAttribute('id', this.project.id),
                new ElementAttribute('data-extra-info', this.project.info),
                new ElementAttribute('draggable', 'true')
            ]);
        projElem.innerHTML = `
            <h2>${this.project.title}</h2>
            <p>${this.project.desc}</p>
            <button class="alt">More Info</button>
            <button>Move to ${this.listToSwitch.listName}</button>
            `;
        const moreInfoBtn = projElem.querySelectorAll('button')[0];
        moreInfoBtn.addEventListener('click', this.showInfo.bind(this));
        const changeTypeBtn = projElem.querySelectorAll('button')[1];
        changeTypeBtn.addEventListener('click', this.changeList.bind(this));

    }
}

class List extends Component{
    constructor(listName) {
        super(`#${listName}-projects`);
        this.listName = listName;
        this.projects = App.allProjects.filter(proj => proj.list === this.listName);
    }

    connectDroppable() {
        const list = document.getElementById(`${this.listName}-list`);

        list.addEventListener('dragenter', event => {
            if (event.dataTransfer.types[0] === 'text/plain') {
                event.preventDefault()
            }
            list.parentElement.classList.add('droppable');
        });
        list.addEventListener('dragover', event => {
            if (event.dataTransfer.types[0] === 'text/plain') {
                event.preventDefault()
            }
        });

        list.addEventListener('dragleave', event => {
            if (event.relatedTarget.closest(`#${this.listName}-list`) !== list) {
                list.parentElement.classList.remove('droppable');
            }
        });

        list.addEventListener('drop', event => {
            const draggedProjId = event.dataTransfer.getData('text/plain');
            if (this.projects.find(proj => proj.id === draggedProjId)) {
                return
            }
            document.getElementById(draggedProjId).querySelectorAll('button')[1].click();
            list.parentElement.classList.remove('droppable');
        }
        );
    }

    setConnectedList(list) {
        this.connectedList = list;
    }

    render() {
        if (!document.getElementById(`${this.listName}-list`)) {
            this.createRootElement('ul', '', [new ElementAttribute('id', `${this.listName}-list`)]);
        }
        if (this.projects && this.projects.length > 0) {
            for (const project of this.projects) {
                new ProjectItem(project, this, this.connectedList)
            }
        }
        this.connectDroppable()
    }
}

class App {
    static allProjects = [];
    static allLists = [];

    static fetchDB() { // DB fetching imitation
        this.allProjects = [
            new ProjectData(
                'Finish the Course',
                'Finish the course within the next two weeks.',
                'p1',
                'Got lifetime access, but would be nice to finish it soon!',
                'active'),
            new ProjectData(
                'Buy Groceries',
                'Don\'t forget to pick up groceries today.',
                'p2',
                'Not really a business topic but still important.',
                'active'),
            new ProjectData(
                'Book Hotel',
                'Academind conference takes place in December, don\'t forget to book a hotel.',
                'p3',
                'Super important conference! Fictional but still!',
                'finished')]
    }

    static renderAllLists() {
        for (const list of this.allLists) {
            list.render()
        }
    }

    static init() {
        this.allLists.push(this.actList = new List('active'));
        this.allLists.push(this.finList = new List('finished'));
        this.actList.setConnectedList(this.finList);
        this.finList.setConnectedList(this.actList);
        this.renderAllLists()
    }

    static refreshLists() {
        for (const list of this.allLists) {
            document.getElementById(`${list.listName}-list`).innerHTML = '';
        }
        this.renderAllLists()
    }
}

App.fetchDB();
App.init();