const excel = require("./excelWriter");
const pdf = require("./pdfWriter");
const grid = require("./grid");

const mockData = require("../../../mockdata");
const mockData2 = require("../../../mockdata2");

class GridController {

    getGridData(req, res) {
        grid.getData(req, res);
    }

    excelWriter(req, res) {
        const filename = "grid";

        mockData2.forEach((data) => {

            excel.setFile(data);

            excel.setHeader();

            excel.setRow();
        });

        excel.write(req, res, filename);

    }

    pdfWriter(req, res) {
        const filename = 'grid';

        pdf.setFile(mockData2);

        pdf.write(req, res, filename);
    }

}

const gridController = new GridController();

module.exports = gridController;
