import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Chart, Doughnut } from 'react-chartjs-2';
import DataProcessing from '../../js/DataProcessing';

export default class DoughnutChart extends Component {
  constructor(props) {
    super(props);

    this.chartInstance = null;
  }

  registerChartPlugin() {
    Chart.pluginService.register({
      beforeDraw: function(chart) {
        if (chart && chart.options && chart.options.customTextInside) {
          const bottomCorner = chart.chartArea.bottom;
          const rightCorner = chart.chartArea.right;
          const ctx = chart.chart.ctx;

          ctx.restore();
          ctx.font = '20px sans-serif';
          ctx.textBaseline = 'middle';

          const texts = chart.options.customTextInside.split('\n');

          for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const textX = Math.round((rightCorner - ctx.measureText(text).width) / 2);
            const lineHeight = texts.length > 1 ? 11 : 0;
            const textY = i == 0 ? (bottomCorner / 2) - lineHeight : bottomCorner / 2 + (i * 22);

            ctx.fillText(text, textX, textY);
            ctx.save();
          }
        }
      },
    });
  }

  parseArrayOfSecondsToTimeString(array) {
    return DataProcessing.parseSecondsIntoTime(DataProcessing.sum(array));
  }
  // @todo There should be event like mousover, hover is dispatch much more times
  onChartHover(chartData, event, items) {
    const chart = this.chartInstance.chartInstance;

    if (event.layerY > chart.chartArea.bottom) {
      return;
    }

    if (items.length) {
      const itemIndex = items[0]._index;
      const chartDataset = chart.data.datasets[0];
      const itemDataInSeconds = chartDataset.data[itemIndex];
      const text = DataProcessing.parseSecondsIntoTime(itemDataInSeconds);
      const percentage = (itemDataInSeconds / DataProcessing.sum(chartData.data) * 100).toFixed(2);

      this.props.handleChartHover(this.props.chartData.labels[itemIndex])

      chart.options.customTextInside = `${text}\n${percentage}%`;
      chart.update();
    } else {
      const customTextInside = this.parseArrayOfSecondsToTimeString(chartData.data);

      if (chart.options.customTextInside !== customTextInside) {
        chart.options.customTextInside = customTextInside;
        chart.update();
      }
    }
  }

  componentWillMount() {
    this.registerChartPlugin();
  }

  render() {
    if (!this.props.renderOnLoad) {
      return null;
    }

    const chartOptions = {
      maintainAspectRatio: false,
      cutoutPercentage: 58,
      customTextInside: this.parseArrayOfSecondsToTimeString(this.props.chartData.data),
      tooltips: {
        enabled: false,
      },
      legend: {
        display: false,
      },
      animation: {
        animateScale: true,
      },
      hover: {
        onHover: this.onChartHover.bind(this, this.props.chartData),
      },
    };
    const chartData = {
      datasets: [{
        data: this.props.chartData.data,
        backgroundColor: this.props.chartData.colors,
      }],
    };

    return (
      <section className={`chart-doughnut__section`}>
        <div className="chart-doughnut__container">
          <Doughnut
            ref={ (ref) => this.chartInstance = ref }
            data={ chartData }
            options={ chartOptions } />
        </div>
      </section>
    );
  }
}

DoughnutChart.propTypes = {
  chartData: PropTypes.object,
  chartName: PropTypes.string,
  renderOnLoad: PropTypes.bool,
};
