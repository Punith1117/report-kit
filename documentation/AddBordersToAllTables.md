# AddBordersToAllTables

LibreOffice Basic macro used by the build pipeline to apply borders
to every table in the generated ODT document.

The macro is stored in `reference.odt` under:

Standard -> Module1 -> AddBordersToAllTables

The build pipeline invokes it with:

```
soffice --headless --norestore \
  "output/report.odt" \
  "macro://./Standard.Module1.AddBordersToAllTables"
```

```text
Sub AddBordersToAllTables()
    Dim oDoc As Object
    Dim oTables As Object
    Dim oTable As Object
    Dim oBorder As New com.sun.star.table.BorderLine
    Dim oTableBorder As New com.sun.star.table.TableBorder
    Dim i As Integer

    oDoc = ThisComponent
    If IsNull(oDoc) Then Exit Sub
    
    oTables = oDoc.getTextTables()

    ' Define border
    oBorder.Color = RGB(0, 0, 0)
    oBorder.OuterLineWidth = 50

    ' Apply layout parameters
    oTableBorder.TopLine = oBorder
    oTableBorder.BottomLine = oBorder
    oTableBorder.LeftLine = oBorder
    oTableBorder.RightLine = oBorder
    oTableBorder.HorizontalLine = oBorder
    oTableBorder.VerticalLine = oBorder

    oTableBorder.IsTopLineValid = True
    oTableBorder.IsBottomLineValid = True
    oTableBorder.IsLeftLineValid = True
    oTableBorder.IsRightLineValid = True
    oTableBorder.IsHorizontalLineValid = True
    oTableBorder.IsVerticalLineValid = True

    For i = 0 To oTables.getCount() - 1
        oTable = oTables.getByIndex(i)
        oTable.TableBorder = oTableBorder
    Next i

    ' Force automated file flush & window teardown
    oDoc.store()
    oDoc.close(True)
End Sub
```
