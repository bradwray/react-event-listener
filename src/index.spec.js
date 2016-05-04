/* eslint-env mocha */
import React from 'react';
import {shallow} from 'enzyme';
import {assert} from 'chai';
import EventListener from './index';

import expect, {
  createSpy,
} from 'expect';
import {
  render,
  unmountComponentAtNode,
} from 'react-dom';
import {
  Simulate,
} from 'react-addons-test-utils';

describe('EventListener', () => {
  describe('props: children', () => {
    it('should work without', () => {
      const wrapper = shallow(
        <EventListener />
      );

      assert.strictEqual(wrapper.children().length, 0,
        'Should work without children');
    });

    it('should render it', () => {
      const wrapper = shallow(
        <EventListener>
          <div>{'Foo'}</div>
        </EventListener>
      );

      assert.strictEqual(wrapper.children().length, 1,
        'Should render his children.');
    });
  });

  let node;
  beforeEach(() => {
    // Pattern from "react-router": http://git.io/vWpfs
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(() => {
    unmountComponentAtNode(node);
    node.parentNode.removeChild(node);
  });

  [
    {
      contextName: 'using Simulate.click(extraNode)',
      name: 'should not invoke event listener to document',
      invokeFn(extraNode) {
        Simulate.click(extraNode);
      },
      expectFn(spy) {
        expect(spy).toNotHaveBeenCalled();
      },
    },
    {
      contextName: 'using extraNode.click()',
      name: 'should invoke event listener to document',
      invokeFn(extraNode) {
        extraNode.click();
      },
      expectFn(spy) {
        expect(spy).toHaveBeenCalled();
      },
    },
  ].forEach(({contextName, name, invokeFn, expectFn}) => {
    describe(contextName, () => {
      it(name, (done) => {
        class TextComponent extends React.Component {
          static propTypes = {
            onClick: React.PropTypes.func,
          };

          handleClick = () => {
            this.props.onClick();
          };

          render() {
            return (
              <EventListener target={document} onClick={this.handleClick} />
            );
          }
        }

        const spy = createSpy();

        render((
          <TextComponent onClick={spy} />
        ), node, () => {
          expect(spy).toNotHaveBeenCalled();

          const extraNode = document.createElement('button');
          document.body.appendChild(extraNode);

          invokeFn(extraNode);
          expectFn(spy);

          extraNode.parentNode.removeChild(extraNode);
          done();
        });
      });
    });
  });

  describe('with no node', () => {
    it("doesn't throw error", () => {
      render(<EventListener onClick={() => {}} />, node);
    });
  });

  describe('when props change', () => {
    it('removes old listeners', () => {
      const spy = createSpy();

      render(<EventListener target={document.body} onClick={spy} />, node);
      render(<EventListener target={document.body} />, node);

      document.body.click();
      expect(spy).toNotHaveBeenCalled();
    });
    it('adds new listeners', () => {
      const spy = createSpy();

      render(<EventListener target={document.body} />, node);

      document.body.click();
      expect(spy).toNotHaveBeenCalled();

      render(<EventListener target={document.body} onClick={spy} />, node);

      document.body.click();
      expect(spy).toHaveBeenCalled();
    });
    it('removes listeners from old node', () => {
      const spy = createSpy();

      render(<EventListener target={document.body} onClick={spy} />, node);
      render(<EventListener onClick={spy} />, node);

      document.body.click();
      expect(spy).toNotHaveBeenCalled();
    });
    it('adds listeners to new node', () => {
      const spy = createSpy();

      render(<EventListener onClick={spy} />, node);
      render(<EventListener target={document.body} onClick={spy} />, node);
      document.body.click();
      expect(spy).toHaveBeenCalled();
    });
    it("doesn't update if props are shallow equal", () => {
      const spy = createSpy();
      const inst = render(<EventListener target={document.body} onClick={spy} />, node);
      const _componentWillUpdate = inst.componentWillUpdate;
      let updated = false;
      inst.componentWillUpdate = (...args) => {
        updated = true;
        _componentWillUpdate(...args);
      };
      render(<EventListener target={document.body} onClick={spy} />, node);
      expect(updated).toBe(false);
    });
  });

  describe('props: capture', () => {
    it('attaches listeners with capture', () => {
      let button;
      const calls = [];

      render(
        <div>
          <EventListener
            target={document}
            capture={true}
            onClick={() => calls.push('outer')}
          />
          <button
            ref={(c) => button = c}
            onClick={() => calls.push('inner')}
          />
        </div>,
        node
      );

      assert.strictEqual(calls.length, 0);
      button.click();
      assert.deepEqual(calls, [
        'outer',
        'inner',
      ], 'Should be called in the right order.');
    });
  });
});
