"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function GenerateReportModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName 
}: GenerateReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
      setGeneratedAt(data.generatedAt);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Split the report into lines and handle page breaks
      const lines = report.split('\n');
      let yPosition = margin;
      const lineHeight = 6;
      
      pdf.setFontSize(10);
      
      lines.forEach((line) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Handle long lines by splitting them
        const splitLines = pdf.splitTextToSize(line || ' ', maxWidth);
        
        splitLines.forEach((splitLine: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Handle different text styles based on markdown-like formatting
          if (splitLine.startsWith('# ')) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(splitLine.substring(2), margin, yPosition);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
          } else if (splitLine.startsWith('## ')) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(splitLine.substring(3), margin, yPosition);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
          } else if (splitLine.startsWith('### ')) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(splitLine.substring(4), margin, yPosition);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
          } else if (splitLine.includes('**') && splitLine.includes('**')) {
            // Handle bold text (simplified)
            const boldText = splitLine.replace(/\*\*(.*?)\*\*/g, '$1');
            pdf.setFont('helvetica', 'bold');
            pdf.text(boldText, margin, yPosition);
            pdf.setFont('helvetica', 'normal');
          } else {
            pdf.text(splitLine, margin, yPosition);
          }
          
          yPosition += lineHeight;
        });
      });
      
      // Save the PDF
      const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setIsCopied(true);
      toast.success('Report copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setReport("");
    setGeneratedAt("");
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Report - {projectName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {!report && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Generate AI Project Report</h3>
                <p className="text-muted-foreground max-w-md">
                  Generate a structured data report showing all project information organized 
                  by tasks, expenses, budget, and updates. Downloads as PDF.
                </p>
              </div>
              <Button onClick={generateReport} className="mt-4">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
              <RefreshCw className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Generating Report...</h3>
                <p className="text-muted-foreground">
                  AI is analyzing your project data and creating a comprehensive report.
                  This may take a few moments.
                </p>
              </div>
            </div>
          )}

          {report && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Report Generated Successfully!</h3>
                <p className="text-muted-foreground">
                  Generated on {new Date(generatedAt).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your project report is ready. Choose an action below to access your report.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={downloadReport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 