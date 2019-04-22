import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import 'remove-focus-outline';

import './scss/styles.scss';

import { processData } from './dom-components/state-change-bar-graph';

import BarGraph from './components/StateChangeBarGraph';
import DonutGraph from './components/StateChangeDonutGraph';
import ContentManager from './components/ContentManager';
import { Tab, Tabs } from './components/Tabs';

const data = {
  current: [
    ['Equities', '2,604,950'],
    ['Fixed income', '1,366,530'],
    ['Brokerage cash', '$230,050'],
    ['Alternative investments', '98,470'],
  ],
  next: [
    ['Equities', '1,265,015'],
    ['Fixed income', '1,533,955'],
    ['Brokerage cash', '586,558'],
    ['Alternative investments', '839,691'],
  ],
};

let tblData = processData(data);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showCurrent: false,
      transitionShowCurrent: true,
      autoSwitch: true,
      data,
    };
  }

  componentDidMount() {
    this.startTransition();
  }

  startTransition() {
    this.transitionInterval = setInterval(() => {
      this.setState(toggle('transitionShowCurrent'));
    }, 4000);
  }

  setTransition(value) {
    this.setState({ transitionShowCurrent: value });
    clearInterval(this.transitionInterval);
  }

  onContentChange(index, value) {
    this.setState(({ data }) => ({ data: {...data, [index]: value }}));
  }

  render() {
    const { showCurrent, transitionShowCurrent, data, tblData } = this.state;
    const [width, height] = [550, 450];

    return (
      <div>
        <ContentManager
          title="Current"
          data={data.current}
          onChange={({ next }) => this.onContentChange('current', next)}
        />
        <ContentManager
          title="Proposed"
          data={data.next}
          onChange={({ next }) => this.onContentChange('next', next)}
        />

        <Tabs>
          <div label="Transition">
            <p className="description">
              Bar graph defining change amount in in each category in relation to static and recomended values.  
            </p>
            <BarGraph
              data={data}
              width={width}
              height={height}
              type={showCurrent ? 'curr' : 'all'}
              firstSelected={showCurrent}
              onSelect={value => this.setState({ showCurrent: value })}
              title="Current::Transition"
            />
          </div>
          <div label="Animated change">
            <p className="description">
              Interactive graph visualizes change using animation.
            </p>
            <div className="transition-donught-graphs">
              <DonutGraph
                title="Current::Proposed"
                data={transitionShowCurrent ? data.current : data.next}
                firstSelected={transitionShowCurrent}
                onSelect={value => this.setTransition(value)}
                width={250}
              />
            </div>
          </div>
          <div label="Static Donut Graph">
            <p className="description">
              Distinct current and proposed graphs are well suitable for
              printed media but not ideal for assessing the change as it requires scanning
              both graphs for change.
            </p>
            <div>
              <div className="static-donut-graphs">
                <DonutGraph data={data.current} title="Current" width={250} />
                <DonutGraph data={data.next} title="Proposed" width={250} />
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    );
  }
}

var mountNode = document.querySelector('.graphs');

function renderApp() {
  ReactDOM.render(<App />, mountNode);
}

renderApp();

function toggle(name) {
  return state => ({ [name]: !state[name] });
}
