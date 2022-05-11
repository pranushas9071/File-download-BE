const exceljs = require("exceljs");

class ExcelWriter {
  constructor() {
    this.workbook = new exceljs.Workbook(); // workbook instance to create a exceljs.
    this.worksheet = null; // worksheet set intially null.
    this.filename = null;
    this.datas = [];
    this.rows = []; // rows for the excel file.
    this.relationInfo = []; // child parent relation information.
    this.header = []; // excel header.
    this.columnConfig = {
      colNumber: 1,
    };
    this.indent = 1;
  }

  // doAddRow methods resolves the nested array into single dimensional array without changing the order of
  // result to display the value properly in the row.
  doAddRow(rowData, level) {
    rowData.forEach((row) => {
      if (row.hasOwnProperty("child")) {
        let deepCopiedRow = JSON.parse(JSON.stringify(row)); // to take the deep of the object.
        delete deepCopiedRow.child; // deleting the child property before pushing to the row.
        deepCopiedRow.outlineLevel = level;
        deepCopiedRow.parent = true; // to set style for parent.
        this.rows.push(deepCopiedRow);
        this.doAddRow(row.child, level + 1); // recursively called if the row has the child proprty.
      } else if (!row.hasOwnProperty("child")) {
        if (level) {
          row.outlineLevel = level;
        }
        row.parent = false; // to set style for child.
        this.rows.push(row);
      }
    });
  }

  // doAddColumn adds returns the array of column with the proper style format.
  // The return object: header: header name, key: key to match the header, width: column width.
  doAddColumn(columnData) {
    return columnData.map((value) => {
      if (typeof value === "string") {
        return {
          header: value,
          key: value,
          width: 25,
        };
      } else if (typeof value === "object") {
        return {
          header: value.name,
          key: value.key,
          width: value.width,
        };
      }
    });
  }

  // set header for the excel file.
  setHeader() {
    if (this.header) {
      this.worksheet.columns = this.doAddColumn(this.header);
      // set the first row value as the header.
      this.worksheet.getRow(1).font = { size: 12, bold: true };
    }
  }

  // set rows data.
  setRow() {
    if (this.datas) {
      this.doAddRow(this.datas, 0);
      // add the rows data into the worksheet .
      this.worksheet.addRows(this.rows);
      this.setOutlineLevel();
    }
  }

  // set outline level to construct row group.
  setOutlineLevel() {
    this.rows.forEach((row, index) => {
      if (row.hasOwnProperty("outlineLevel")) {
        const groupRow = this.worksheet.getRow(index + 2);
        this.setCellStyle(row, groupRow);
        groupRow.outlineLevel = row.outlineLevel;
      }
    });
  }

  setCellStyle(row, groupRow) {
    groupRow.eachCell((cell, colNumber) => {
      if (colNumber === this.columnConfig.colNumber) {
        cell.alignment = { indent: row.outlineLevel * this.indent };
        cell.font = {
          bold: row.parent,
        };
      }
    });
  }

  // entry method here we create the worksheet with the sheet name as provided.
  setFile(tableData) {
    if (this.rows) {
      this.rows = [];
    }
    this.worksheet = this.workbook.addWorksheet(tableData.sheet);
    this.header = tableData.info.header; // intialized value for header.
    this.datas = tableData.info.data; // intialized value for row.
    return;
  }

  // write the excel file and send the stream of data to the front end.
  async write(req, res, filename) {
    // set the response header with content type and content disposition.
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment;filename=${filename}.xlsx`,
      "Access-Control-Expose-Headers": "Content-Disposition",
    });
    try {
      await this.workbook.xlsx.write(res); // write function return the stream.
    } catch (error) {
      res.send(error).status(500).end();
    }
  }
}

const excel = new ExcelWriter();

module.exports = excel;
